// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, State};
use tauri_plugin_store::StoreExt;
use tokio::sync::oneshot;
use warp::Filter;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthState {
    code_verifier: String,
    state: String,
    client_id: String,
    port: u16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    access_token: String,
    token_type: String,
    expires_in: u64,
    refresh_token: Option<String>,
    scope: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StoredTokens {
    access_token: String,
    refresh_token: Option<String>,
    expires_at: u64, // Unix timestamp
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthResult {
    success: bool,
    access_token: Option<String>,
    refresh_token: Option<String>,
    error: Option<String>,
}

type AuthStateManager = Arc<Mutex<HashMap<String, AuthState>>>;

// Generate a cryptographically secure random string
fn generate_random_string(length: usize) -> String {
    use rand::Rng;
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let mut rng = rand::thread_rng();
    (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

// Generate PKCE code challenge from verifier
fn generate_code_challenge(verifier: &str) -> String {
    use sha2::{Digest, Sha256};
    let digest = Sha256::digest(verifier.as_bytes());
    general_purpose::URL_SAFE_NO_PAD.encode(digest)
}

// Get current Unix timestamp
fn get_current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

// Find an available port from a list of preferred ports
async fn find_available_port() -> Result<u16, String> {
    let preferred_ports = [8888, 8889, 8890, 8891, 8892, 8893, 8894, 8895, 8896, 8897];
    
    for port in preferred_ports {
        match tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port)).await {
            Ok(_) => return Ok(port),
            Err(_) => continue,
        }
    }
    
    Err("No available ports found in range 8888-8897".to_string())
}

#[tauri::command]
async fn start_spotify_auth(
    client_id: String,
    state_manager: State<'_, AuthStateManager>,
) -> Result<(String, u16), String> {
    let code_verifier = generate_random_string(128);
    let code_challenge = generate_code_challenge(&code_verifier);
    let state = generate_random_string(16);
    
    // Find an available port
    let port = find_available_port().await?;
    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);
    
    // Store the auth state with the port
    {
        let mut manager = state_manager.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
        manager.insert(state.clone(), AuthState {
            code_verifier: code_verifier.clone(),
            state: state.clone(),
            client_id: client_id.clone(),
            port,
        });
    }

    let scopes = [
        "streaming",
        "user-read-email",
        "user-read-private",
        "user-library-read",
        "user-library-modify",
        "user-read-playback-state",
        "user-modify-playback-state",
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-public",
        "playlist-modify-private"
    ].join(" ");

    let auth_url = format!(
        "https://accounts.spotify.com/authorize?client_id={}&response_type=code&redirect_uri={}&code_challenge_method=S256&code_challenge={}&state={}&scope={}",
        client_id,
        urlencoding::encode(&redirect_uri),
        code_challenge,
        state,
        urlencoding::encode(&scopes)
    );

    Ok((auth_url, port))
}

#[tauri::command]
async fn save_tokens(
    app_handle: tauri::AppHandle,
    access_token: String,
    refresh_token: Option<String>,
    expires_in: u64,
) -> Result<(), String> {
    let tokens = StoredTokens {
        access_token,
        refresh_token,
        expires_at: get_current_timestamp() + expires_in,
    };

    let store = app_handle.store_builder("auth.json").build()
        .map_err(|e| format!("Failed to create store: {}", e))?;
    
    let tokens_json = serde_json::to_value(&tokens)
        .map_err(|e| format!("Failed to serialize tokens: {}", e))?;
    
    store.set("tokens", tokens_json);
    store.save().map_err(|e| format!("Failed to save tokens: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn load_tokens(app_handle: tauri::AppHandle) -> Result<Option<StoredTokens>, String> {
    let store = app_handle.store_builder("auth.json").build()
        .map_err(|e| format!("Failed to create store: {}", e))?;
    
    if let Some(tokens_json) = store.get("tokens") {
        let tokens: StoredTokens = serde_json::from_value(tokens_json)
            .map_err(|e| format!("Failed to deserialize tokens: {}", e))?;
        
        // Check if token is still valid (with 5-minute buffer)
        let current_time = get_current_timestamp();
        if tokens.expires_at > current_time + 300 {
            Ok(Some(tokens))
        } else {
            // Token expired, clear stored tokens
            let _ = clear_tokens(app_handle).await;
            Ok(None)
        }
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn clear_tokens(app_handle: tauri::AppHandle) -> Result<(), String> {
    let store = app_handle.store_builder("auth.json").build()
        .map_err(|e| format!("Failed to create store: {}", e))?;
    
    store.delete("tokens");
    store.save().map_err(|e| format!("Failed to clear tokens: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn start_auth_server(
    app_handle: tauri::AppHandle,
    state_manager: State<'_, AuthStateManager>,
    port: u16,
) -> Result<(), String> {
    let state_manager = state_manager.inner().clone();
    let app_handle = app_handle.clone();

    tokio::spawn(async move {
        let (tx, rx) = oneshot::channel();
        let tx = Arc::new(Mutex::new(Some(tx)));

        let callback_route = warp::path("callback")
            .and(warp::query::<HashMap<String, String>>())
            .and(warp::any().map(move || tx.clone()))
            .and(warp::any().map(move || state_manager.clone()))
            .and_then(handle_callback);

        let routes = callback_route.or(
            warp::path::end().map(|| {
                warp::reply::html(
                    r#"
                    <html>
                        <body>
                            <h1>Authentication in progress...</h1>
                            <p>Please wait while we complete the authentication process.</p>
                            <script>
                                // Auto-close after a short delay
                                setTimeout(() => {
                                    window.close();
                                }, 2000);
                            </script>
                        </body>
                    </html>
                    "#,
                )
            })
        );

        let server = warp::serve(routes).run(([127, 0, 0, 1], port));
        
        tokio::select! {
            _ = server => {},
            result = rx => {
                if let Ok(auth_result) = result {
                    let _ = app_handle.emit("auth-result", auth_result);
                }
            }
        }
    });

    Ok(())
}

async fn handle_callback(
    params: HashMap<String, String>,
    tx: Arc<Mutex<Option<oneshot::Sender<AuthResult>>>>,
    state_manager: AuthStateManager,
) -> Result<impl warp::Reply, warp::Rejection> {
    let mut auth_result = AuthResult {
        success: false,
        access_token: None,
        refresh_token: None,
        error: None,
    };

    if let Some(error) = params.get("error") {
        auth_result.error = Some(format!("Authorization error: {}", error));
    } else if let (Some(code), Some(state)) = (params.get("code"), params.get("state")) {
        // Verify state and get code verifier
        let auth_state = {
            let mut manager = state_manager.lock().unwrap();
            manager.remove(state)
        };

        if let Some(auth_state) = auth_state {
            // Exchange code for token using the stored port
            match exchange_code_for_token(code, &auth_state.code_verifier, &auth_state.client_id, auth_state.port).await {
                Ok(token_response) => {
                    auth_result.success = true;
                    auth_result.access_token = Some(token_response.access_token);
                    auth_result.refresh_token = token_response.refresh_token;
                }
                Err(e) => {
                    auth_result.error = Some(format!("Token exchange failed: {}", e));
                }
            }
        } else {
            auth_result.error = Some("Invalid state parameter".to_string());
        }
    } else {
        auth_result.error = Some("Missing authorization code".to_string());
    }

    // Send result back to the frontend
    if let Ok(mut sender) = tx.lock() {
        if let Some(sender) = sender.take() {
            let _ = sender.send(auth_result);
        }
    }

    Ok(warp::reply::html(
        r#"
        <html>
            <body>
                <h1>Authentication Complete!</h1>
                <p>You can now close this window and return to the Better Spotify app.</p>
                <script>
                    setTimeout(() => {
                        window.close();
                    }, 2000);
                </script>
            </body>
        </html>
        "#,
    ))
}

async fn exchange_code_for_token(
    code: &str,
    code_verifier: &str,
    client_id: &str,
    port: u16,
) -> Result<TokenResponse, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let redirect_uri = format!("http://127.0.0.1:{}/callback", port);

    let params = [
        ("grant_type", "authorization_code"),
        ("code", code),
        ("redirect_uri", &redirect_uri),
        ("client_id", client_id),
        ("code_verifier", code_verifier),
    ];

    let response = client
        .post("https://accounts.spotify.com/api/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .form(&params)
        .send()
        .await?;

    if response.status().is_success() {
        let token_response: TokenResponse = response.json().await?;
        Ok(token_response)
    } else {
        let status = response.status();
        let error_text = response.text().await?;
        
        // Try to parse Spotify's error format
        if let Ok(error_json) = serde_json::from_str::<serde_json::Value>(&error_text) {
            let error_msg = if let Some(error_desc) = error_json.get("error_description") {
                // OAuth error format
                format!("Spotify OAuth error: {}", error_desc.as_str().unwrap_or("Unknown error"))
            } else if let Some(error_obj) = error_json.get("error") {
                // Regular API error format
                if let Some(message) = error_obj.get("message") {
                    format!("Spotify API error: {}", message.as_str().unwrap_or("Unknown error"))
                } else {
                    format!("Spotify error: {}", error_obj.as_str().unwrap_or("Unknown error"))
                }
            } else {
                format!("HTTP {} - {}", status, error_text)
            };
            Err(error_msg.into())
        } else {
            Err(format!("HTTP {} - {}", status, error_text).into())
        }
    }
}

fn main() {
    let auth_state_manager: AuthStateManager = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(auth_state_manager)
        .invoke_handler(tauri::generate_handler![
            start_spotify_auth, 
            start_auth_server,
            save_tokens,
            load_tokens,
            clear_tokens
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
