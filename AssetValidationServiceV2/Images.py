from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydub import AudioSegment
import aiohttp
import magic
from io import BytesIO
import speech_recognition as sr

app = FastAPI()

Webhook = ""

BANNED_KEYWORDS = ["nigger", "nigga", "faggot"]

AudioSignatures = {
    b"ID3": ".mp3",
    b"\xff\xfb": ".mp3",
    b"OggS": ".ogg",
}

async def SendAudioToDiscord(chunk, ext, username, userId, punishment, filename, signature):
    async with aiohttp.ClientSession() as session:
        content = (
            f"**sm1 legit tried to bypass a audio, clown them.**\n"
            f"**bypasser:** {username} ({userId})\n"
            f"**punishment:** {punishment}\n"
            f"**file:** {filename}\n"
            f"**signature (file type):** {signature} ({ext})"
        )
        
        form = aiohttp.FormData()
        form.add_field(
            "file",
            BytesIO(chunk), 
            filename=f"detected_audio{ext}",
            content_type="application/octet-stream"
        )
        form.add_field("content", content)
        async with session.post(Webhook, data=form) as resp:
            if resp.status not in (200, 204):
                print(f"Failed to send to Discord: {resp.status}")

def Validate(data: bytes, ext: str) -> bool:
    try:
        Type = magic.from_buffer(data, mime=True)
        if not Type.startswith("audio/"):
            return False
        
        audio = AudioSegment.from_file(BytesIO(data), format=ext.replace(".", ""))
        # gng pls dont remove ts its a db checker and a uhh track checker channels is the tracks and max is 2
        if len(audio) < 100 or audio.max == 0 or audio.channels > 2:
            return False
        # also dw abt the wav here its js for speech recognition
        recognizer = sr.Recognizer()
        wav_io = BytesIO()
        audio.export(wav_io, format="wav")
        wav_io.seek(0)
        
        with sr.AudioFile(wav_io) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data)
                if text and any(word in text.lower() for word in BANNED_KEYWORDS):
                    return True
            except (sr.UnknownValueError, sr.RequestError):
                pass

        return False
        
    except Exception:
        return False
        
Images = (".png", ".jpg", ".jpeg", ".webp")

@app.post("/validateImage")
async def ValidateImage(
    file: UploadFile = File(...),
    username: str = Form("Unknown"),
    userId: str = Form("0"),
    punishment: str = Form("Unknown"),
    filename: str = Form("Unknown")
):
    if not file.filename.lower().endswith(Images):
        raise HTTPException(
            status_code=400,
            detail=f"Only these image files are allowed: {', '.join(Images)}"
        )

    content = await file.read()
    found = False
    detected_signature = ""
    detected_ext = ""

    if b"audio_data" in content:
        idx = content.find(b"audio_data")
        chunk = content[idx + 11: idx + 11 + 10 * 1024 * 1024]
        for ext in [".mp3", ".ogg"]:
            if Validate(chunk, ext):
                found = True
                detected_signature = "audio_data"
                detected_ext = ext
                await SendAudioToDiscord(chunk, ext, username, userId, punishment, filename, detected_signature)
                break

    if not found:
        for sig, ext in AudioSignatures.items():
            start = 0
            while True:
                idx = content.find(sig, start)
                if idx == -1:
                    break
                
                max_size = 10 * 1024 * 1024
                chunk = content[idx: idx + max_size]

                if Validate(chunk, ext):
                    found = True
                    detected_signature = sig.decode('ascii', errors='replace')
                    detected_ext = ext
                    await SendAudioToDiscord(chunk, ext, username, userId, punishment, filename, detected_signature)
                    break
                
                start = idx + 1
            if found:
                # dumbass lowk
                break

    if found:
        raise HTTPException(status_code=400, detail="Found audio in image")

    return JSONResponse({"status": "ok"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3030)