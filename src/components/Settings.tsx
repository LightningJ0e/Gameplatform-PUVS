import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

interface Props {
  setShowSettings: (show: boolean) => void;
  onSave?: () => void;
}

export default function Settings({ setShowSettings, onSave }: Props) {
  const { user } = useAuth();
  const [userName, setUserName] = useState(user?.username);
  const [profileImage, setProfileImage] = useState<string | null>(
    localStorage.getItem("profileImage")
  );
  const [previewImage, setPreviewImage] = useState<string | null>(profileImage);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Bild ist zu groß. Maximal 5MB erlaubt.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Bitte wählen Sie eine Bilddatei aus.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (previewImage) {
      localStorage.setItem("profileImage", previewImage);
      setProfileImage(previewImage);
    }
    if (userName) {
      localStorage.setItem("username", userName);
    }

    // Call the callback to refresh parent component
    if (onSave) {
      onSave();
    }

    setShowSettings(false);
  };

  const handleCancel = () => {
    setPreviewImage(profileImage); // Reset preview
    setUserName(user?.username); // Reset username
    setShowSettings(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-140 max-w-[90vw] border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 my-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Change Username
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4 my-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Picture
            </label>

            {/* Bildvorschau */}
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-600 flex items-center justify-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {userName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Max. 5MB, JPG/PNG/GIF
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
