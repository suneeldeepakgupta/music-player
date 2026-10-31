
from flask import Flask, request, jsonify ,send_file,render_template
import urllib.parse
from pathlib import Path
from main import download_file,download_song
import sqlite3
from lrctoolbox import SyncedLyrics

PROJECT_DIR = Path(__file__).resolve().parent
DATABASE_PATH = PROJECT_DIR / "data.db"
app=Flask(__name__)

@app.after_request
def no_cache(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.get("/api/music/<path>")
def get_music(path):
    path=urllib.parse.unquote(path)
    path=PROJECT_DIR / 'audio' / path
    if path.exists():
        return send_file(str(path),as_attachment=False)
    return send_file(str(path).replace("opus","webm"),as_attachment=False)

@app.get("/api/video/<path>")
def get_video(path):
    path=urllib.parse.unquote(path)
    path=PROJECT_DIR / 'videos' / path
    return send_file(path,as_attachment=False)


@app.route("/api/lyric/<path>")
def get_lyric(path):
    path=urllib.parse.unquote(path)
    path=PROJECT_DIR / 'lyrics' / path
    if path.exists() == False:
        return {}
    with open(path,"r",encoding="utf-8") as f:
        text= f.read()
        arr=[""]
        i=0
        for ch in text:
            if ch=="\n":
                arr.append("")
                i+=1
            else:
                arr[i]+=ch
        lyrics={}
        for line in arr:    
            if line.strip() == "" or "[ti:" in line or "[ar:" in line or "[al:" in line or "[au" in line or "[length" in line or "[by" in line  or "[by:" in line or "[length:" in line:  
                continue  
            if line[0]=="[":  
                time_str=line[1:line.index("]")]  
                minutes, seconds = time_str.split(":")  
                time = int(minutes) * 60 + float(seconds)  
                lyrics[time]=line[line.index("]")+1:]  
        return lyrics

@app.route('/api/thumbnail/<path>')
def get_thmb(path):
    path=urllib.parse.unquote(path)
    path=PROJECT_DIR / 'albums' / path
    return send_file(path)

@app.route("/player")
def index():
    return send_file(PROJECT_DIR / "player.html")
 
@app.post("/api/download")
def d():
    j=request.get_json()
    download_file(j["url"])
    return "done"

@app.get("/api/tracks")
@app.get("/api/tracks/")
def e():
    conn=sqlite3.connect(DATABASE_PATH)
    cursor=sqlite3.Cursor(conn)
    cursor.execute("SELECT * FROM music")
    files=[]
    for row in cursor.fetchall():
        a={}
        a["id"]=row[1]
        a["title"]=row[2]
        a["duration"]=row[3]
        a["album"]=row[4]
        a["audio"]=urllib.parse.quote(f"/api/music/{row[1]}.webm")
        if (PROJECT_DIR / "videos" / f"{row[1]}.webm").exists():
            a["video"]=urllib.parse.quote(f"/api/video/{row[1]}.webm")
        else:
            a["video"]="na"
        a["thumbnail"]=f"/api/thumbnail/{row[4]}.webp"
        a["artists"]=row[5]
        a["is_liked"]=row[6]
        files.append(a)
    conn.close()    
    return files[::-1]

@app.route("/hello")
def indejj():
    return send_file(PROJECT_DIR / "artists.html")

@app.get("/api/artists")
def get_all_artists():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT artist FROM artists")
    artists = [row[0] for row in cursor.fetchall()]

    conn.close()
    return artists
@app.route("/artist")
def hhggcc():
    return render_template("artist_tracks.html")
@app.get("/api/artist")
def get_artist():
    artist_name = urllib.parse.unquote(request.args.get('artist_name'))
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT m.*
        FROM music AS m
        JOIN artists AS a ON m.audio_id = a.audio_id
        WHERE a.artist = ?
    """, (artist_name,))

    files = []
    for row in cursor.fetchall():
        a = {}
        a["id"] = row[1]
        a["title"] = row[2]
        a["duration"] = row[3]
        a["album"] = row[4]
        a["artists"] = row[5]
        a["audio"]=urllib.parse.quote(f"/api/music/{row[1]}.webm")
        if (PROJECT_DIR / "videos" / f"{row[1]}.webm").exists():
            a["video"]=urllib.parse.quote(f"/api/video/{row[1]}.webm")
        else:
            a["video"]="na"
        a["is_liked"] = row[6]
        a["thumbnail"]=f"/api/thumbnail/{row[4]}.webp"
        files.append(a)

    conn.close()
    return files

@app.get("/artists")
def hfggggg():
    return render_template("artist.html")
@app.get("/api/album/<id>")
def gge(id):
    id=urllib.parse.unquote(id)
    conn=sqlite3.connect(DATABASE_PATH)
    cursor=sqlite3.Cursor(conn)
    cursor.execute("""
        SELECT *
        FROM music
        WHERE album = ?
    """, (id,))
    files=[]
    for row in cursor.fetchall():
        a={}
        a["id"]=row[1]
        a["title"]=row[2]
        a["duration"]=row[3]
        a["album"]=row[4]
        a["audio"]=urllib.parse.quote(f"/api/music/{row[1]}.webm")
        if (PROJECT_DIR / "videos" / f"{row[1]}.webm").exists():
            a["video"]=urllib.parse.quote(f"/api/video/{row[1]}.webm")
        else:
            a["video"]="na"
        a["thumbnail"]=urllib.parse.quote(f"/api/thumbnail/{row[4]}.webp")
        a["artists"]=row[5]
        a["is_liked"]=row[6]
        files.append(a)
    conn.close()    
    return files

@app.get("/api/metadata/<id>")
def get_123(id):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM music WHERE audio_id = ?",
        (id,)
    )
    row = cursor.fetchone()
    conn.close()

    if row is None:
        return {"error": "Metadata not found"}, 404
    if (PROJECT_DIR / "videos" / f"{row[1]}.webm").exists():
        a=urllib.parse.quote(f"/api/video/{row[1]}.webm")
    else:
        a="na"
    return jsonify({
        "id": row[1],
        "title": row[2],
        "duration": row[3],
        "album": row[4],
        "video":a,
        "audio":urllib.parse.quote(f"/api/music/{row[1]}.webm"),
        "thumbnail":urllib.parse.quote(f"/api/thumbnail/{row[4]}.webp"),
        "artists": row[5],
        "lyrics":get_lyric(id+'.lrc') or {},
        "is_liked":row[6]
    })
@app.post("/download")
def bbvd():
    j=request.get_json()
    print(j)
    download_file(j["url"])
    return "done"
@app.get("/api/album")
def get_albums():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT DISTINCT album
            FROM music
            WHERE album IS NOT NULL AND album != ''
            ORDER BY album
        """)
        return [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()

@app.route("/manifest.json")
def manifest():
    return send_file(PROJECT_DIR / "manifest.json")


@app.route("/album")
def ffdrd():
    return render_template("album.html")
@app.route("/album-page/<name>")
def reder_alb_page(name):
    return render_template("album_page.html",name=name)
@app.route("/icon.svg")
def icon():
    return send_file(PROJECT_DIR / "icon.svg")

@app.route("/")
def f():
   return render_template("index.html")
@app.route("/tracks")
def return_tracks():
    return render_template("tracks.html")
if __name__=="__main__":
    app.run(host="0.0.0.0",port=5000,debug=True,threaded=True)