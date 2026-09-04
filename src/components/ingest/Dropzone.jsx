import React, { useState } from 'react';
import {
  UploadCloud,
  HardDrive,
  FileVideo,
  FolderPlus
} from 'lucide-react';

export const Dropzone = ({ onSelectFile }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    file.displaySize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    onSelectFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => {
          setDragOver(false);
        }}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver
            ? 'border-forensic-cyan bg-forensic-cyan/10 shadow-glow-cyan'
            : 'border-forensic-border hover:border-forensic-border-light bg-forensic-900/50'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-forensic-850 border border-forensic-cyan/40 flex items-center justify-center text-forensic-cyan">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-100">
              Mount Seized DVR/NVR Disk Image or Video Container
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Supports raw bitstream dumps (<span className="font-mono text-cyan-300">.dd, .raw, .img, .e01</span>) and videos/streams (<span className="font-mono text-cyan-300">.mp4, .avi, .mkv, .dav, .bin</span>)
            </p>
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-forensic-cyan text-black font-bold rounded-lg hover:bg-cyan-300 cursor-pointer text-xs transition-colors shadow-glow-cyan">
              <FolderPlus className="w-4 h-4" />
              <span>Browse Local Evidence Image or Video</span>
              <input
                type="file"
                className="hidden"
                accept="video/*,.avi,.mp4,.dav,.mkv,.mov,.flv,.wmv,.dd,.raw,.img,.e01,.bin,.hsv,.sec"
                onChange={handleFileInput}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-forensic-900 border border-forensic-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-4 h-4 text-forensic-cyan" />
          <span className="text-xs font-bold text-slate-300 uppercase">
            Supported Evidence Formats
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-forensic-950 border border-forensic-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileVideo className="w-4 h-4 text-cyan-300" />
              <span className="font-bold text-slate-200">
                Standard Videos
              </span>
            </div>
            <p className="text-slate-400 font-mono">
              .mp4 • .avi • .mov • .mkv • .dav
            </p>
          </div>

          <div className="bg-forensic-950 border border-forensic-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-4 h-4 text-cyan-300" />
              <span className="font-bold text-slate-200">
                Forensic Disk Images
              </span>
            </div>
            <p className="text-slate-400 font-mono">
              .dd • .raw • .img • .e01 • .bin • .hsv • .sec
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};