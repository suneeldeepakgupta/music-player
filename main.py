import yt_dlp
import json
import unicodedata
import requests
import sqlite3
import traceback
from urllib.parse import urlparse, parse_qs,urljoin
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
AUDIO_DIR = PROJECT_DIR / "audio"
ALBUMS_DIR = PROJECT_DIR / "albums"
VIDEOS_DIR = PROJECT_DIR / "videos"
LYRICS_DIR = PROJECT_DIR / "lyrics"
DATABASE_PATH = PROJECT_DIR / "data.db"

def save_thumbnail(video_id, albumname):
    ALBUMS_DIR.mkdir(parents=True, exist_ok=True)
 #https://i.ytimg.com/vi_webp/9MaV5vwzxTQ/hq720.webp
    url = f"https://i.ytimg.com/vi_webp/{video_id}/hq720.webp"
    path = ALBUMS_DIR / f"{albumname}.webp"
    url2 = f"https://i.ytimg.com/vi_webp/{video_id}/sddefault.webp"
    
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()

        if not response.headers.get("Content-Type", "").startswith("image/"):
            return None

        with open(path, "wb") as f:
            f.write(response.content)
        return str(path)
    except requests.RequestException as e:
        print(f"Thumbnail error: {e}")
        return None

lrc_api="https://lrclib.net/api/search"
def download_video(url, file_name):
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    options1 = {
        "retries": 5,
        "fragment_retries": 5,
        "sleep_interval": 2,
        "max_sleep_interval": 5,
        "extractor_retries": 3,
        "format": "bestvideo[height<=1920][ext=webm]+bestaudio[ext=webm]/best[height<=480][ext=webm]",
        "outtmpl": str(VIDEOS_DIR / f"{file_name}.webm"),
        "merge_output_format": "webm",
        "quiet": True,
        "ratelimit": 2000 * 1024,
        "no_warnings": True,
        "noplaylist": True,
    }

    with yt_dlp.YoutubeDL(options1) as ydl:
        ydl.download([url])


def search_video(query, file_name):
    options = {
        "quiet": True,
        "extract_flat": True,
        "skip_download": True,
    }

    with yt_dlp.YoutubeDL(options) as ydl:
        data = ydl.extract_info(
            f"ytsearch5:{query}",
            download=False
        )

        entries = data.get("entries") or []

        if not entries:
            print("No search results found")
            return 1

        entry = entries[0]

        video_id = entry.get("id")
        if not video_id:
            print("Video ID not found")
            return 1

        url = f"https://www.youtube.com/watch?v={video_id}"

        print("Selected:", entry.get("title"))
        print("URL:", url)

        download_video(url, file_name)
        return 0
def init_db():
    conn=sqlite3.connect(DATABASE_PATH)
    cursor=sqlite3.Cursor(conn)

    cursor.execute("""  
        CREATE TABLE IF NOT EXISTS music (  
            id INTEGER PRIMARY KEY AUTOINCREMENT,  
            audio_id TEXT NOT NULL,  
            title TEXT NOT NULL,  
            duration INT NOT NULL,  
            album TEXT NOT NULL,  
            artists TEXT NOT NULL, 
            is_liked BOOLEAN DEFAULT 0
        )  
    """) 

    cursor.execute("""  
        CREATE TABLE IF NOT EXISTS artists (  
            id INTEGER PRIMARY KEY AUTOINCREMENT,  
            artist TEXT,  
            audio_id TEXT NOT NULL  
        )  
    """) 
    conn.commit()  
    conn.close() 



init_db()
options = {
    "outtmpl": {
        "default": str(AUDIO_DIR / "%(id)s.%(ext)s"),
        "thumbnail": str(ALBUMS_DIR / "%(album)s.%(ext)s"),
    },
    "overwrites": False,
    "format": "ba[acodec=opus]/ba",
    "sleep_interval": 2,
    "retries": 5,
    "fragment_retries": 5,
    "extractor_retries": 3,
    "max_sleep_interval": 5,
    "ratelimit": 500 * 1024,
    "windowsfilenames": False,
    "restrictfilenames": False,
    "writethumbnail": True,
    "ignoreerrors": True,
}
def get_dev(a,b):
    if a is None or b is None:
        return 999
    if(a>=b):
        return a-b
    else:
        return b-a

def write_save_lrc(I,p,duration):
    response = requests.get(lrc_api, params=p)
    print("--------------",response.status_code)
    if response.status_code == 429 or response.status_code == 503:
        print("Rate limited (429). Skipping lyrics.")
        return 1
    if response.status_code == 503:
        print("LRCLIB server overloaded. Skipping lyrics.")
        return 1
    if response.status_code != 200:
        print("HTTP error:", response.status_code)
        return 1
    try:
        js = response.json()
    except requests.exceptions.JSONDecodeError:
        print("Invalid JSON response")
        return 1
    dev = 14324
    lrc = ""
    if not isinstance(js, list):
        print("Unexpected JSON format")
        return 1

    for o in js:
        if not isinstance(o, dict):
            continue
        dur2 = o.get("duration")
        if dur2 is None:
            dur2 = 0

        d = abs(duration - dur2)
        print(
            "duration:", duration,
            "duration from lrc:", dur2,
            "dev:", d,
            "\nlrc:", o.get("syncedLyrics"),
            "\n"
        )
        synced = o.get("syncedLyrics")
        if synced and d < dev:
            dev = d
            lrc = synced


    LYRICS_DIR.mkdir(parents=True, exist_ok=True)
    with open(LYRICS_DIR / f"{I}.lrc", "w", encoding="utf-8") as f:
        f.write(lrc)
        return 0
        print("duration:", duration, "dev:", dev)


def after_download(info):
    conn=sqlite3.connect(DATABASE_PATH)
    cursor=sqlite3.Cursor(conn)
    print(info.keys())
    print("\n"*4)
    print("Title:", info.get("title"))
    print("ID:", info.get("id"))
    print("Duration:", info.get("duration"))
    print("Artist" ,info.get("artist"))
    p = {  
        "track_name": info.get("title"),  
        "artist_name": info.get("artists")[0]  
    }  
    title=info.get("title")
    album=info.get("album")
    duration=info.get("duration")
    I=info.get("id")
    save_thumbnail(I,album)
    cursor.execute("""  
        INSERT INTO music (audio_id, title,duration, album, artists)   
         VALUES (?, ?, ?, ?,?)  
    """, (I, title,duration, album, info["artist"]))  
    
    for artist in info["artists"]:  
        cursor.execute("""  
            INSERT INTO artists(artist,audio_id)  
            VALUES (?,?)  
        """,(artist,I))  

    cursor.execute("""  
        DELETE FROM music  
        WHERE id NOT IN (  
            SELECT MIN(id)  
            FROM music  
            GROUP BY audio_id  
        )  
    """)  

    cursor.execute("""  
        DELETE FROM artists  
        WHERE id NOT IN (  
            SELECT MIN(id)  
            FROM artists  
            GROUP BY artist, audio_id  
        )  
    """)  
    conn.commit()  
    conn.close()  
    for i in range(10):
        try:
            if write_save_lrc(I, p, duration)==0:
                break
        except Exception as e:
            print("Lyrics error:", e)
    print("23444&&_54&6+&;-&")
    search_video(title,I)


def download_song(url):
    def hook(d):
        if d["status"] == "finished":
            after_download(d["info_dict"])
    options["progress_hooks"] = [hook]
    with yt_dlp.YoutubeDL(options) as ydl:
        ydl.download([url])

def get_video_urls(url: str) -> list[str]:
    options = {
        "extract_flat": True,
        "skip_download":True,
        "ignoreerrors": True,
    }
    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(url, download=False)

        if not info:
            return []
        with open(PROJECT_DIR / "data.json", "w", encoding="utf-8") as f:
            json.dump(info, f, indent=4, ensure_ascii=False)
        return [info["webpage_url"]]
def add_path(url, path):
    return urljoin(url.rstrip("/") + "/", path.lstrip("/"))

def download_file(url):
    download_song(url)   
