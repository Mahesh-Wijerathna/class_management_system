import React, { useState, useEffect } from 'react';
import { FaTimes, FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaComments, FaUsers, FaCog } from 'react-icons/fa';

const SecureZoomMeeting = ({ zoomLink, className, onClose, isOpen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meetingId, setMeetingId] = useState(null);
  const [password, setPassword] = useState(null);

  useEffect(() => {
    if (zoomLink && isOpen) {
      extractZoomInfo(zoomLink);
    }
  }, [zoomLink, isOpen]);

  const extractZoomInfo = (link) => {
    try {
      // Extract meeting ID and password from zoom link
      // Example: https://zoom.us/j/123456789?pwd=abcdefgh
      const url = new URL(link);
      const pathParts = url.pathname.split('/');
      const extractedMeetingId = pathParts[pathParts.length - 1];
      
      // Extract password from query parameters
      const extractedPassword = url.searchParams.get('pwd') || '';
      
      setMeetingId(extractedMeetingId);
      setPassword(extractedPassword);
      setIsLoading(false);
    } catch (err) {
      setError('Invalid zoom link format');
      setIsLoading(false);
    }
  };

  const generateSecureEmbedUrl = () => {
    if (!meetingId) return null;
    
    // Create a secure embed URL that doesn't expose the original link
    let embedUrl = `https://zoom.us/wc/join/${meetingId}`;
    
    if (password) {
      embedUrl += `?pwd=${password}`;
    }
    
    return embedUrl;
  };

  const [useIframe, setUseIframe] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  const handleJoinMeeting = () => {
    const embedUrl = generateSecureEmbedUrl();
    if (embedUrl) {
      if (useIframe) {
        // Use iframe approach - more secure but may have limitations
        setUseIframe(true);
      } else {
        // Open in a new window with specific dimensions and no toolbar
        const popup = window.open(
          embedUrl,
          'zoom_meeting',
          'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
        );
        
        if (popup) {
          // Focus the popup
          popup.focus();
        } else {
          alert('Please allow popups for this site to join the meeting.');
        }
      }
    }
  };

  const handleIframeJoin = () => {
    setUseIframe(true);
  };

  const handleClose = () => {
    setUseIframe(false);
    setIsMinimized(false);
    setPosition({ x: 0, y: 0 });
    setInitialPosition({ x: 0, y: 0 });
    onClose();
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return; // Don't drag if clicking buttons
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep the overlay within viewport bounds
    const maxX = window.innerWidth - (isMinimized ? 384 : 800); // 384px for minimized, 800px for normal
    const maxY = window.innerHeight - (isMinimized ? 96 : 600); // 96px for minimized, 600px for normal
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Set initial position when overlay opens
  useEffect(() => {
    if (useIframe && !initialPosition.x && !initialPosition.y) {
      const centerX = (window.innerWidth - (isMinimized ? 384 : 800)) / 2;
      const centerY = (window.innerHeight - (isMinimized ? 96 : 600)) / 2;
      setPosition({ x: centerX, y: centerY });
      setInitialPosition({ x: centerX, y: centerY });
    }
  }, [useIframe, isMinimized, initialPosition]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isDragging, dragOffset, isMinimized]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (useIframe) {
          handleClose();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [useIframe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setUseIframe(false);
      setIsMinimized(false);
      setPosition({ x: 0, y: 0 });
      setInitialPosition({ x: 0, y: 0 });
    };
  }, []);

  if (!isOpen) return null;

  // If using iframe, show the embedded meeting as an overlay
  if (useIframe) {
    const embedUrl = generateSecureEmbedUrl();
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999]" onClick={handleClose}>
        <div 
          className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
            isMinimized 
              ? 'w-96 h-24' 
              : 'w-full max-w-6xl h-[90vh]'
          } flex flex-col absolute`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'move'
          }}
          onMouseDown={handleMouseDown}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg cursor-move">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <FaVideo className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Live Class Meeting</h2>
                <p className="text-sm text-gray-600">{className}</p>
              </div>
            </div>
            <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                <FaVideo className="inline mr-1" />
                Live
              </span>
              <button
                onClick={() => {
                  setIsMinimized(!isMinimized);
                  // Reset position when maximizing to center the window
                  if (isMinimized) {
                    const centerX = (window.innerWidth - 800) / 2;
                    const centerY = (window.innerHeight - 600) / 2;
                    setPosition({ x: centerX, y: centerY });
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                title="Close Meeting"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>
          
          {/* Meeting Container */}
          {!isMinimized && (
            <div className="flex-1 relative bg-gray-100 rounded-b-lg overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="camera; microphone; fullscreen; speaker; display-capture"
                title="Zoom Meeting"
              />
              
              {/* Floating Controls */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                              <button
                onClick={handleClose}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <FaTimes className="text-sm" />
                Leave Meeting
              </button>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe');
                    if (iframe && iframe.requestFullscreen) {
                      iframe.requestFullscreen();
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                  title="Fullscreen"
                >
                  <FaVideo className="text-sm" />
                  Fullscreen
                </button>
              </div>
            </div>
          )}
          
          {/* Minimized State */}
          {isMinimized && (
            <div className="flex-1 bg-blue-50 rounded-b-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-blue-600 mb-2">
                  <FaVideo className="text-2xl mx-auto" />
                </div>
                <p className="text-sm text-blue-700 font-medium">Meeting Active</p>
                <p className="text-xs text-blue-600">Click maximize to return to meeting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <FaVideo className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Join Class Meeting</h2>
              <p className="text-sm text-gray-600">{className}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Preparing secure meeting room...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <FaTimes className="text-4xl mx-auto mb-2" />
                <p className="font-semibold">Error</p>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Instructions */}
                              <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCog className="text-yellow-600" />
                    <span className="font-semibold text-yellow-800">Instructions</span>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Click "Join Meeting" to access your class</li>
                    <li>• Allow camera and microphone access when prompted</li>
                    <li>• Enter your name when joining the meeting</li>
                    <li>• Choose your preferred join method below</li>
                  </ul>
                </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <FaMicrophone className="text-green-600" />
                  <span className="text-sm">Audio Available</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <FaVideo className="text-green-600" />
                  <span className="text-sm">Video Available</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <FaComments className="text-green-600" />
                  <span className="text-sm">Chat Available</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                  <FaUsers className="text-green-600" />
                  <span className="text-sm">Screen Share</span>
                </div>
              </div>

              {/* Join Options */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Choose Join Method:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded border">
                    <input
                      type="radio"
                      id="popup"
                      name="joinMethod"
                      value="popup"
                      defaultChecked
                      className="text-blue-600"
                    />
                    <label htmlFor="popup" className="flex-1">
                      <div className="font-medium">New Window (Recommended)</div>
                      <div className="text-sm text-gray-600">Opens in a separate window with full features</div>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded border">
                    <input
                      type="radio"
                      id="iframe"
                      name="joinMethod"
                      value="iframe"
                      className="text-blue-600"
                    />
                    <label htmlFor="iframe" className="flex-1">
                      <div className="font-medium">Overlay View</div>
                      <div className="text-sm text-gray-600">Opens as an overlay on this page</div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    const method = document.querySelector('input[name="joinMethod"]:checked').value;
                    if (method === 'iframe') {
                      handleIframeJoin();
                    } else {
                      handleJoinMeeting();
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaVideo className="text-lg" />
                  Join Meeting
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecureZoomMeeting; 