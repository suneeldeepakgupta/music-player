const player = document.getElementById('player');
const lyricContainer = document.getElementById('lyrics-container');
const audio = document.getElementById('audio');
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const audio_id = urlParams.get('song');
const bg_img_cont = document.getElementById("bg-image");
const overlay = document.getElementById("overlay");
const next = document.getElementById("next");
const prev = document.getElementById("prev");
const seekBackwardButton = document.getElementById('seek-backward');
const seekForwardButton = document.getElementById('seek-forward');
const artworkImg = document.getElementById('artwork');
const lyricsToggle = document.getElementById('lyrics-toggle');
const playButton = document.getElementById('play');
const playHtml = `<svg xmlns="http://www.w3.org/2000/svg" height="53px" viewBox="0 -960 960 960" width="53px" fill="#e3e3e3"><path d="m383-310 267-170-267-170v340Zm97 230q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z"/></svg>`;
const pauseHtml = `<svg xmlns="http://www.w3.org/2000/svg" height="53px" viewBox="0 -960 960 960" width="53px" fill="#e3e3e3"><path d="M370-320h60v-320h-60v320Zm160 0h60v-320h-60v320ZM480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z"/></svg>`;
const video =document.getElementById("video");

function setPWAColor(color) {
    document.querySelector('meta[name="theme-color"]')
        .setAttribute("content", color);
}

window.addEventListener('pageshow', (event) => {
    const navType = performance.getEntriesByType('navigation')[0]?.type;
    if (event.persisted || navType === 'back_forward') {
        window.location.reload();
    }
});

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    seconds = Math.floor(seconds);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = n => String(n).padStart(2, "0");

    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(secs)}`
        : `${minutes}:${pad(secs)}`;
}

function matchImageSideBars(img) {

    const imageUrl = img.currentSrc || img.src;
    const element = document.querySelector('#player');

    if (!element) {
        throw new Error("Image has no parent element");
    }
    if (!img.complete || !img.naturalWidth) {
        return new Promise((resolve, reject) => {
            img.addEventListener(
                "load",
                () => resolve(matchImageSideBars(img)),
                { once: true }
            );
            img.addEventListener(
                "error",
                () => reject(new Error("Image failed to load")),
                { once: true }
            );
        });
    }

    const box = element.getBoundingClientRect();
    const imageRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = box.width / box.height;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d", {
        willReadFrequently: true
    });

    let leftColor = "#000";
    let rightColor = "#000";

    try {
        ctx.drawImage(img, 0, 0);

        function sampleEdge(x) {
            const samples = [];
            const step = Math.max(
                1,
                Math.floor(img.naturalHeight / 100)
            );

            for (let y = 0; y < img.naturalHeight; y += step) {
                const pixel = ctx.getImageData(x, y, 1, 1).data;
                samples.push([pixel[0], pixel[1], pixel[2]]);
            }

            const avg = [0, 1, 2].map(channel =>
                Math.round(
                    samples.reduce((sum, p) => sum + p[channel], 0)
                    / samples.length
                )
            );

            return `rgb(${avg[0]}, ${avg[1]}, ${avg[2]})`;
        }

        leftColor = sampleEdge(0);
        rightColor = sampleEdge(img.naturalWidth - 1);
    } catch (error) {
        console.warn(
            "Cannot sample image pixels; image may be cross-origin.",
            error
        );
    }

    const hasSideBars = imageRatio < boxRatio;
    //element.style=`background-color:${leftColor}`;
    if (hasSideBars) {
        element.style.background = `linear-gradient(
        to top,
        color-mix(in srgb, ${leftColor} 30%, black) 10%,
        ${leftColor} 100%
    )`;
    } else {
        element.style.background = `linear-gradient(
        to top,
        color-mix(in srgb, ${leftColor} 30%, black) 10%,
        ${leftColor} 100%
    )`;

        document.body.style.minHeight = "100vh";
        document.body.style.margin = "0";
        document.body.style.background = `linear-gradient(
        to top left,
        color-mix(in srgb, ${leftColor} 6%, rgb(20, 19, 19)),
        color-mix(in srgb, ${leftColor} 30%, rgb(17, 16, 16))
        )`;

    }
    setPWAColor(leftColor);
    const bgI = `url("${imageUrl}")`;
    
    bg_img_cont.style.backgroundColor = leftColor;
    bg_img_cont.style.backgroundImage = bgI;
    overlay.style.background = `linear-gradient(
        to top,
        color-mix(in srgb,${leftColor} 15%, black) 10%,
        ${leftColor} 100%
    )`;
    overlay.style.opacity = "0.7";

    return {
        url: imageUrl,
        img,
        element,
        leftColor,
        rightColor,
        hasSideBars
    };
}



document.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
        event.preventDefault();
        if (audio.paused) {
            audio.play();
            // player.classList.add('playing');
        } else {
            audio.pause();
            //.classList.remove('playing');
        }
    }
});

function load_player(lrc, I) {
    lyricContainer.innerHTML = "";
    fetch('/home').then(response => response.json()).then(data => {
        prev.removeEventListener('click', play_prev_song, { once: true });
        next.removeEventListener('click', play_next_song, { once: true });
        audio.removeEventListener('ended', play_next_song, { once: true });
        let n = 0;
        for (e of data) {
            if (e["id"] == I) {
                let a, b;
                console.log(n);
                a = data[n + 1] || data[0];
                b = data[n - 1] || data[data.length - 1];
                id_next = a['id'];
                id_prev = b['id'];
            };
            n += 1;
        } console.log("prev",id_prev);
        console.log("next",id_next);
        function play_prev_song() {
            if (id_prev) {
                fetch_metadata(id_prev);
                const url = new URL(window.location.href);
                url.searchParams.set('song', id_prev);
                window.history.pushState({}, '', url);
            }
        }
        function play_next_song() {
            if (id_next) {
                fetch_metadata(id_next);
                const url = new URL(window.location.href);
                url.searchParams.set('song', id_prev);
                window.history.pushState({}, '', url);
            }
        }
        next.addEventListener('click', play_next_song, { once: true });
        prev.addEventListener('click', play_prev_song, { once: true });
        audio.addEventListener('ended', play_next_song, { once: true });
    })
    let a = 0;
    for (const key in lrc) {
        const lyric = document.createElement('button');
        lyric.classList.add('lyric');
        lyric.id = a;
        if (lrc[key].trim() != "") {
            lyric.textContent = lrc[key]
        }
        else {
            lyric.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" ><path d="M287-167q-47-47-47-113t47-113q47-47 113-47 23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47q-66 0-113-47Z"/></svg>`;
        }
        lyricContainer.appendChild(lyric);
        lyric.addEventListener('click', () => {
            audio.currentTime = parseFloat(key);
        });
        a += 1;
    }

    const keys = Object.keys(lrc);
    const progress = document.getElementById('progress');
    progress.addEventListener('input', () => {
        const seekTime = (progress.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    });
}
let curr_idx = -1;
function f() {
    const keys = Object.keys(lrc);
    progress.value = (audio.currentTime / audio.duration) * 100 || 0
    const currentTime = audio.currentTime;
    document.getElementById('current-time').textContent = formatTime(currentTime);
    for (let i = 0; i < keys.length; i++) {

        if (currentTime >= parseFloat(keys[i]) && currentTime < parseFloat(keys[i + 1])) {
            if (curr_idx != i) {
                curr_idx = i;

                document.querySelectorAll('.lyric').forEach(lyric => {
                    lyric.classList.remove('highlight');
                });
                document.getElementById(i).scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
                document.getElementById(i).classList.add('highlight');
            }

        }
    };
}

audio.addEventListener('play', () => {
    playButton.innerHTML = pauseHtml;
});
audio.addEventListener('pause', () => {
    playButton.innerHTML = playHtml;
});
seekBackwardButton.addEventListener('click', () => {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
    video.currentTime = Math.max(0, (audio.currentTime+0.5*(video.duration-audio.duration)) - 5);
    
});
seekForwardButton.addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 5); });
let lrc;



function fetch_metadata(x) {
    
    fetch('/metadata/' + x).then(response => response.json()).then(data => {
        let a = 0;
        lrc = data["lyrics"]
        if (parseFloat(Object.keys(lrc)[0]) != 0) {
            let x = { "0.00": " " };
            lrc = { ...x, ...lrc };
        };

        const I = data['id'];
        const title = data["title"];
        const artist = data["artists"];
        const album = data["album"];
        const dur = data["duration"];
        const thumb_url=data["thumbnail"];
        const audio_url=data["audio"];
        const video_url=data["video"];
        if(video_url!="na"){
            video.src=video_url;
        }
        
        audio.src = audio_url;
        document.getElementById('duration').textContent = formatTime(dur);
        document.getElementById("artwork-img").src = thumb_url;
        document.getElementById('song-title').textContent = decodeURIComponent(title);
        document.getElementById('artist').textContent = artist;
        console.log(lrc); 
        matchImageSideBars(document.getElementById("artwork-img"))
            
       
        load_player(lrc, I);
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: decodeURIComponent(title),
                artist: artist || "Artist Name",
                album: album || "My Music",
                artwork: [
                    {
                        src: thumb_url,
                        sizes: "720x720",
                        type: "image/webp"
                    }
                ]
            });
            navigator.mediaSession.setActionHandler("play", () => {
                audio.play();
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                audio.pause();
            });
            navigator.mediaSession.setActionHandler("seekbackward", () => {
                audio.currentTime = Math.max(0, audio.currentTime - 5);
            });
            navigator.mediaSession.setActionHandler("seekforward", () => {
                audio.currentTime = Math.min(
                    audio.duration || Infinity,
                    audio.currentTime + 5
                );
            });
        }
        document.querySelector(".loading").style.display = "none";
    });
}
audio.addEventListener("timeupdate", f);

fetch_metadata(audio_id);

lyricContainer.style.display = 'none';
bg_img_cont.style.display = "none";

playButton.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        video.play()
    } else {
        audio.pause();
        video.pause();
    }
});
video.currentTime=5;
function randomEvery5s(video) {
    let timer;

    function startTimer() {
        if (timer) return;

        timer = setInterval(() => {
            if (!Number.isFinite(video.duration-5) || video.duration-5 <= 0) return;

            video.currentTime = Math.random() * (video.duration-5);
        }, 10000);
    }

    function stopTimer() {
        clearInterval(timer);
        timer = null;
    }

    video.addEventListener("play", startTimer);
    video.addEventListener("pause", stopTimer);

    if (!video.paused) startTimer();

    return stopTimer;
}



const timer = randomEvery5s(document.querySelector("video"));

// Stop:
// clearInterval(timer);
function minimize() {
    hide_lyrics();
    player.classList.replace("player", "miniplayer");
    console.log("1");
    //overlay.style.display = "none";
    //bg_img_cont.style.display = "none";
    if (!document.getElementById("emm").src) {
        document.getElementById("emm").setAttribute("src", "/");
    }
}
if (document.documentElement.clientHeight < document.documentElement.clientWidth) {
    minimize();
} else {
    maximize();
}

function maximize() {
    document.getElementById("player").classList.replace("miniplayer", "player");
}

function hide_lyrics() {
    lyricContainer.style.display = 'none';
    lyricContainer.style.display = 'none';
    artworkImg.style.display = 'flex';
    bg_img_cont.style.display = "none";
    overlay.style.display = "none";
    artworkImg.style.transform = 'scale(0)';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            artworkImg.style.transform = 'scale(1)';
        });
    });
}

function show_lyrics() {
    artworkImg.style.transform = 'scale(0)';
    artworkImg.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'transform') {
            artworkImg.style.display = 'none';
            lyricContainer.style.display = 'flex';
            overlay.style.display = "block";
            bg_img_cont.style.display = "block";
            artworkImg.removeEventListener('transitionend', handler);
        }
    });
}

document.getElementById("close").addEventListener('click', () => {
    if (player.classList.contains("player")) {
        minimize();
    }
})

document.getElementById("artwork").addEventListener('click', () => {
    if (player.classList.contains("miniplayer")) {
        maximize();
    } else {
        if (lyricContainer.style.display == "none") {
            show_lyrics();
        } else {
            hide_lyrics();
        }
    }
});

lyricsToggle.addEventListener('click', () => {
    if (player.classList.contains("miniplayer")) {
        maximize();
    } else {
        if (lyricContainer.style.display == "none") {
            show_lyrics();
        } else {
            hide_lyrics();
        }
    }
})


document.getElementById("like").addEventListener('click', () => {
    document.querySelector("#like").firstElementChild.classList.toggle("active");
})





