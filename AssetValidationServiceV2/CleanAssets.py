import os
import magic
from io import BytesIO
from pydub import AudioSegment
import sys

AudioSignatures = {
    b"ID3": ".mp3",
    b"\xff\xfb": ".mp3",
    b"RIFF": ".wav",
    b"OggS": ".ogg",
}

def Validate(data: bytes, ext: str) -> bool:
    try:
        Type = magic.from_buffer(data, mime=True)
        if not Type.startswith("audio/"):
            return False
        
        audio = AudioSegment.from_file(BytesIO(data), format=ext.replace(".", ""))
        
        if len(audio) <= 0:
            return False

        if len(audio) < 100:
            return False

        if audio.max == 0:
            return False
            
        return True
        
    except Exception:
        return False

def check_file_for_audio(file_path):
    try:
        with open(file_path, "rb") as f:
            content = f.read()
    except Exception as e:
        print(f"error reading {file_path}: {e}")
        return False

    if b"audio_data" in content:
        idx = content.find(b"audio_data")
        chunk = content[idx + 11: idx + 11 + 10 * 1024 * 1024]
        for ext in [".mp3", ".ogg", ".wav"]:
            if Validate(chunk, ext):
                return True

    for sig, ext in AudioSignatures.items():
        start = 0
        while True:
            idx = content.find(sig, start)
            if idx == -1:
                break
            
            max_size = 10 * 1024 * 1024
            chunk = content[idx: idx + max_size]

            if Validate(chunk, ext):
                return True
            
            start = idx + 1
    return False

def clean_directory(dir_path):
    if not os.path.exists(dir_path):
        print(f"{dir_path} does not exist.")
        return

    print(f"cleaning assets in: {dir_path}")
    
    deleted_count = 0
    total_scanned = 0

    for root, dirs, files in os.walk(dir_path):
        for file in files:
            full_path = os.path.join(root, file)
            total_scanned += 1
            
            try:
                mime = magic.from_file(full_path, mime=True)
                if not mime.startswith("image/"):
                    continue
                
                if check_file_for_audio(full_path):
                    print(f"[DETECTED] audio bypass found in: {file} ({mime})")
                    try:
                        os.remove(full_path)
                        print(f"[DELETED] {file}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"[ERROR] failed to delete {file}: {e}")
                
            except Exception as e:
                continue
            if total_scanned % 100 == 0:
                print(f"scanned {total_scanned} files...")

    print("-" * 30)
    print(f"clean up complete.")
    print(f"scanned: {total_scanned}")
    print(f"deleted: {deleted_count}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python CleanAssets.py pathherefr")
        sys.exit(1)
    
    target_dir = sys.argv[1]
    clean_directory(target_dir)