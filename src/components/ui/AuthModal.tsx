import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '../ui';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSubmit: (token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onTokenSubmit }) => {
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (token.trim()) {
      onTokenSubmit(token.trim());
      setToken('');
      setStep(1);
      onClose();
    }
  };

  const exampleUrl = "http://127.0.0.1:8888/callback#access_token=BQC4h2x9ABC123xyz789...&token_type=Bearer";
  const exampleToken = "BQC4h2x9ABC123xyz789...";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Spotify Authentication</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-white">Authorize with Spotify</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              2
            </div>
            <span className="text-white">Copy access token from URL</span>
          </div>

          <div className="bg-gray-900 p-3 rounded text-sm">
            <p className="text-gray-300 mb-2">After authorization, you'll see a URL like:</p>
            <div className="bg-gray-700 p-2 rounded text-xs text-green-400 font-mono break-all">
              {exampleUrl}
            </div>
            <p className="text-gray-300 mt-2 mb-1">Copy this part (the access token):</p>
            <div className="bg-gray-700 p-2 rounded text-xs text-yellow-400 font-mono break-all">
              {exampleToken}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Paste your access token here:
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="BQC4h2x9ABC123xyz789..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleSubmit}
              disabled={!token.trim()}
              className="flex-1"
              variant="primary"
            >
              Connect to Spotify
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
