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
const artlrc = document.getElementById("artwork-lrc");
const artworkImg = document.getElementById('artwork');
const lyricsToggle = document.getElementById('lyrics-toggle');
const playButton = document.getElementById('play');
const loop_btn = document.getElementById("loop-btn");
const playHtml = `<svg xmlns="http://www.w3.org/2000/svg" height="53px" viewBox="0 -960 960 960" width="53px" fill="#e3e3e3"><path d="m383-310 267-170-267-170v340Zm97 230q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z"/></svg>`;
const pauseHtml = `<svg xmlns="http://www.w3.org/2000/svg" height="53px" viewBox="0 -960 960 960" width="53px" fill="#e3e3e3"><path d="M370-320h60v-320h-60v320Zm160 0h60v-320h-60v320ZM480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z"/></svg>`;
const video = document.getElementById("video");
const headphone = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Zm-80-240h-80v160h80v-160Zm400 0v160h80v-160h-80Zm-400 0h-80 80Zm400 0h80-80Z"/></svg>`;
const queue_cont = document.querySelector(".queue");
const delete_svg = `<svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#e3e3e3"><path d="M267.33-120q-27.5 0-47.08-19.58-19.58-19.59-19.58-47.09V-740H160v-66.67h192V-840h256v33.33h192V-740h-40.67v553.33q0 27-19.83 46.84Q719.67-120 692.67-120H267.33Zm425.34-620H267.33v553.33h425.34V-740Zm-328 469.33h66.66v-386h-66.66v386Zm164 0h66.66v-386h-66.66v386ZM267.33-740v553.33V-740Z"/></svg>`;
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

    element.style.background = `linear-gradient(
        to top,
        color-mix(in srgb, ${leftColor} 20%, black) 6%,
        ${leftColor} 100%
    )`;
    document.getElementById("progress").style.accentColor = leftColor;
    document.body.style.minHeight = "100vh";
    document.body.style.margin = "0";
    document.body.style.background = `linear-gradient(
        to top left,
        color-mix(in srgb, ${leftColor} 6%, rgb(20, 19, 19)),
        color-mix(in srgb, ${leftColor} 30%, rgb(17, 16, 16))
        )`;


    document.getElementById("emm").style.background = `linear-gradient(
        to top left,
        color-mix(in srgb, ${leftColor} 6%, rgb(20, 19, 19)),
        color-mix(in srgb, ${leftColor} 30%, rgb(17, 16, 16))
        )`;
    setPWAColor(leftColor);
    const bgI = `url("${imageUrl}")`;
    bg_img_cont.style.backgroundColor = leftColor;
    bg_img_cont.style.backgroundImage = bgI;
    overlay.style.background = `linear-gradient(
        to top,
        color-mix(in srgb,${leftColor} 15%, black) 10%,
        ${leftColor} 100%
    )`;
    overlay.style.opacity = "0.8";
    if (window["home_page"]) {
        window["home_page"].body.style.background = `linear-gradient(
        to top left,
        color-mix(in srgb, ${leftColor} 6%, rgb(20, 19, 19)),
        color-mix(in srgb, ${leftColor} 30%, rgb(17, 16, 16))
        )`;
    }
    if (window["track_page"]) {
        window["track_page"].body.style.background = `linear-gradient(
        to top left,
        color-mix(in srgb, ${leftColor} 6%, rgb(20, 19, 19)),
        color-mix(in srgb, ${leftColor} 30%, rgb(17, 16, 16))
        )`;
    }
    if (window["artist_page"]) {
        window["artist_page"].body.style.background = `linear-gradient(
        to top left,
        color-mix(in srgb, ${leftColor} 6%, rgb(20, 19, 19)),
        color-mix(in srgb, ${leftColor} 30%, rgb(17, 16, 16))
        )`;
    }

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
        } else {
            audio.pause();

        }
    }
});

let queue_inited = false;
window.add_queue = function (el) {
    if (!document.getElementById(el.id)) {
        const card = document.createElement("div");
        card.className = "track";
        card.draggable = true;
        const img = document.createElement("img");
        const div = document.createElement("div");
        const id = el.id;
        card["info"] = el;
        card.id = id;
        card["delete"] = function () {
            this.parentElement.removeChild(this);
        }
        card.addEventListener("click", () => {
            const url = new URL(window.location.href);
            url.searchParams.set("song", id);
            history.replaceState({}, "", url);
            window.fetch_metadata(id);
        });
        img.src = el.thumbnail;
        const a = document.createElement("div");
        const b = document.createElement("div");
        a.innerText = el.title;
        b.innerText = el.artists;
        div.append(a, b);
        const c = document.createElement("button");
        c.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log(e.currentTarget.m.delete());
        })
        c.innerHTML = delete_svg;
        c["m"] = card;
        card.append(img, div, c);
        queue_cont.appendChild(card);
    }
}
window.add_next = function (el) {
    if (!document.getElementById(el.id)) {
        const card = document.createElement("div");
        card.className = "track";
        card.draggable = true;
        const img = document.createElement("img");
        const div = document.createElement("div");
        const id = el.id;
        card["info"] = el;
        card.id = id;
        card["delete"] = function () {
            this.parentElement.removeChild(this);
        }
        card.addEventListener("click", () => {
            const url = new URL(window.location.href);
            url.searchParams.set("song", id);
            history.replaceState({}, "", url);
            window.fetch_metadata(id);
        });
        img.src = el.thumbnail;
        const a = document.createElement("div");
        const b = document.createElement("div");
        a.innerText = el.title;
        b.innerText = el.artists;
        div.append(a, b);
        const c = document.createElement("button");
        c.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log(e.currentTarget.m.delete());
        })
        c.innerHTML = delete_svg;
        c["m"] = card;
        card.append(img, div, c);
        document.querySelector(".playing").after(card);
    } else {
        document.querySelector(".playing").insertAdjacentElement("afterend", document.getElementById(el.id));
    }
}
async function init_queue() {
    if (queue_inited) {
        return;
    }

    let l = "/api/tracks";

    if (urlParams.get("album")) {
        l = `/api/album/${encodeURIComponent(urlParams.get("album"))}`;
    } else if (urlParams.get("artist")) {
        l = `/api/artist?artist_name=${encodeURIComponent(urlParams.get("artist"))}`;
    }
    const response = await fetch(l);
    if (!response.ok) {
        throw new Error(`Failed to load queue: ${response.status}`);
    }
    const data = await response.json();
    const d = data.slice(0, 40);
    for (const el of d) {
        const card = document.createElement("div");
        card.className = "track";
        card.draggable = true;
        const img = document.createElement("img");
        const div = document.createElement("div");
        const id = el.id;
        card["info"] = el;
        card.id = id;
        card["delete"] = function () {
            this.parentElement.removeChild(this);
        }
        card.addEventListener("click", () => {
            const url = new URL(window.location.href);
            url.searchParams.set("song", id);
            history.replaceState({}, "", url);
            window.fetch_metadata(id);
        });
        img.src = el.thumbnail;
        const a = document.createElement("div");
        const b = document.createElement("div");
        a.innerText = el.title;
        b.innerText = el.artists;
        div.append(a, b);
        const c = document.createElement("button");
        c.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log(e.currentTarget.m.delete());
        })
        c.innerHTML = delete_svg;
        c["m"] = card;
        card.append(img, div, c);
        queue_cont.appendChild(card);
    }
    queue_inited = true;
}

window.load_player = async function (lrc, I, el) {
    await init_queue();
    if (!document.getElementById(I)) {
        console.log("inted queue");
        console.log("no element exists");
        const card = document.createElement("div");
        card.className = "track";
        const img = document.createElement("img");
        const div = document.createElement("div");
        const id = el.id;
        card.id = id;
        card["info"] = el;
        card["delete"] = function () {
            this.parentElement.removeChild(this);
        }
        card.draggable = true;
        card.addEventListener("click", () => {
            const url = new URL(window.location.href);
            url.searchParams.set("song", id);
            history.replaceState({}, "", url);
            window.fetch_metadata(id);
        });
        img.src = el.thumbnail;
        const a = document.createElement("div");
        const b = document.createElement("div");

        a.innerText = el.title;
        b.innerText = el.artists;
        div.append(a, b);
        const c = document.createElement("button");
        c.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log(e.currentTarget.m.delete());
        })
        c.innerHTML = delete_svg;
        c["m"] = card;
        card.appendChild(img);
        card.appendChild(div);
        card.appendChild(c);
        if (document.querySelector(".playing")) {
            document.querySelector(".playing").after(card)
        } else {
            //queue_cont.appendChild(card);
            queue_cont.insertBefore(card, document.querySelector(".track"));
        }

    }else{
    
    }
    document.querySelectorAll(".track").forEach(e => {
        e.classList.remove("playing");
    })
    document.getElementById(I).classList.add("playing");
    lyricContainer.innerHTML = "";

    prev.removeEventListener('click', play_prev_song, { once: true });
    next.removeEventListener('click', play_next_song, { once: true });
    audio.removeEventListener('ended', play_next_song, { once: true });

    function play_prev_song() {
        if (document.querySelector(".playing").previousElementSibling.info.id) {
            window.fetch_metadata(document.querySelector(".playing").previousElementSibling.info.id);
            const url = new URL(window.location.href);
            url.searchParams.set("song", document.querySelector(".playing").previousElementSibling.info.id);
            history.replaceState({}, '', url);
        }
    }

    function play_next_song() {
        if (document.querySelector(".playing").nextElementSibling.info.id) {
            const url = new URL(window.location.href);
            url.searchParams.set("song", document.querySelector(".playing").nextElementSibling.info.id);
            history.replaceState({}, '', url);
            window.fetch_metadata(document.querySelector(".playing").nextElementSibling.info.id);
        }
    }
    window.play_next_song = play_next_song;
    window.play_prev_song = play_prev_song;
    next.addEventListener('click', window.play_next_song, { once: true });
    prev.addEventListener('click', window.play_prev_song, { once: true });
    audio.addEventListener('ended', window.play_next_song, { once: true });


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



window.route_parent = function (I) {
    const url = new URL(window.location.href);
    console.log(url);
    url.searchParams.set("song", I);
    history.replaceState({}, '', url);
}


function scrollToElement(container, element, duration = 1000) {
    const start = container.scrollTop;

    const target =
        element.getBoundingClientRect().top
        - container.getBoundingClientRect().top
        + container.scrollTop
        - (container.clientHeight - element.offsetHeight) / 2;
    const distance = target - start;
    let startTime = null;

    function animate(time) {
        if (startTime === null) startTime = time;

        const progress = Math.min((time - startTime) / duration, 1);

        // Ease-in-out
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        container.scrollTop = start + distance * eased;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
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

                scrollToElement(lyricContainer, document.getElementById(i), 500)
                //document.getElementById(i).scrollIntoView({
                //behavior: 'smooth',
                //block: 'center',
                //inline: 'center'
                //});
                document.getElementById(i).classList.add('highlight');
            }

        }
    };
}

audio.addEventListener('play', () => {
    playButton.innerHTML = pauseHtml;
    document.querySelector(".playing").classList.remove("paused");
});
audio.addEventListener('pause', () => {
    playButton.innerHTML = playHtml;
    document.querySelector(".playing").classList.add("paused");
});

window.fetch_metadata = function (x) {
    video.src = ""
    fetch('api/metadata/' + x).then(response => response.json()).then(data => {
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
        const thumb_url = data["thumbnail"];
        const audio_url = data["audio"];
        const video_url = data["video"];
        if (video_url != "na") {
            video.src = video_url;
        } else {

        }
        audio.src = audio_url;
        document.getElementById('duration').textContent = formatTime(dur);
        document.getElementById("artwork-img").src = thumb_url;
        document.getElementById('song-title').textContent = decodeURIComponent(title);
        document.getElementById('artist').textContent = album;
        console.log(lrc);
        matchImageSideBars(document.getElementById("artwork-img"))
        window.load_player(lrc, I, data);
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
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                window.play_next_song();
            });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                window.play_prev_song();
            });
        }
        document.querySelector(".loading").style.display = "none";
    });
}
audio.addEventListener("timeupdate", f);

window.fetch_metadata(audio_id);

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
video.currentTime = 10;
function randomEvery5s(video) {
    let timer;

    function startTimer() {
        if (timer) return;

        timer = setInterval(() => {
            const min = 15;
            const max = video.duration - 15;

            if (!Number.isFinite(max) || max <= min) return;

            video.currentTime = min + Math.random() * (max - min);
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
// 
function video_toggle_up() {
    video.classList.remove("hidden");
    document.getElementById("video-toggle").classList.add("enabled");
}
function video_toggle_down() {
    video.classList.add("hidden");
    document.getElementById("video-toggle").classList.remove("enabled");
}

function minimize() {
    video_toggle_down();
    hide_lyrics();
    queue_cont.style.display = "none";
    player.classList.replace("player", "miniplayer");
    console.log("1");
    //overlay.style.display = "none";
    //bg_img_cont.style.display = "none";
    if (!document.getElementById("emm").src) {
        //if (!urlParams.get("album")) {
        //document.getElementById("emm").setAttribute("src", `/album-page/${urlParams.get("album")}`);
        // } else {
        document.getElementById("emm").setAttribute("src", "/");
        // }

    }
}
if (document.documentElement.clientHeight < document.documentElement.clientWidth) {
    minimize();
} else {
    maximize();
}

function maximize() {
    //queue_cont.style.display = "flex";
    document.getElementById("player").classList.replace("miniplayer", "player");
}
document.getElementById("video-toggle").style.display = "none"

function hide_lyrics() {
    lyricContainer.style.display = 'none';
    lyricContainer.style.display = 'none';
    lyricsToggle.classList.remove("enabled");
    artworkImg.style.display = 'flex';
    bg_img_cont.style.display = "none";
    overlay.style.display = "none";
    artworkImg.style.transform = 'scale(0)';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            artworkImg.style.transform = 'scale(1)';
            document.getElementById("video-toggle").style.display = "none";
        });

    });
}

function show_lyrics() {
    artworkImg.style.transform = 'scale(0)';
    lyricsToggle.classList.add("enabled");
    artworkImg.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'transform') {
            artworkImg.style.display = 'none';
            lyricContainer.style.display = 'flex';
            overlay.style.display = "block";
            bg_img_cont.style.display = "block";
            artworkImg.removeEventListener('transitionend', handler);
            document.getElementById("video-toggle").style.display = "flex";
        }
    });
}

document.getElementById("close").addEventListener('click', () => {
    if (player.classList.contains("player")) {
        minimize();
    }
})


document.getElementById("video-toggle").addEventListener("click", () => {
    if (video.classList.contains("hidden")) {
        video_toggle_up();
    } else {
        video_toggle_down();
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
const toggleBtn = document.getElementById("toggle-queue");
toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = queue_cont.classList.contains("queuetranslate");
    if (!isOpen) {
        queue_cont.style.display = "flex";
        requestAnimationFrame(() => {
            queue_cont.classList.add("queuetranslate");
        });
        document.addEventListener("click", closeQueueOnOutsideClick, { once: true });
    }
});

function closeQueueOnOutsideClick(e) {
    if (queue_cont.contains(e.target)) {
        document.addEventListener("click", closeQueueOnOutsideClick, { once: true });
        return;
    }
    queue_cont.classList.remove("queuetranslate");
    function handleTransitionEnd(event) {
        if (event.propertyName === 'transform') {
            queue_cont.style.display = "none";
            queue_cont.removeEventListener('transitionend', handleTransitionEnd);
        }
    }

    queue_cont.addEventListener('transitionend', handleTransitionEnd);
}
queue_cont.addEventListener("click", (e) => {
    e.stopPropagation();
})
queue_cont.firstElementChild.addEventListener("click", () => {
    queue_cont.classList.remove("queuetranslate");
})







const container = queue_cont;
let draggedItem = null;

container.addEventListener("dragstart", (e) => {
    draggedItem = e.target.closest(".track");

    if (!draggedItem) return;

    draggedItem.classList.add("dragging");

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
});

container.addEventListener("dragover", (e) => {
    e.preventDefault();

    const target = e.target.closest(".track");

    if (!target || target === draggedItem) return;

    const rect = target.getBoundingClientRect();

    // Works for both row and column flex layouts.
    const isColumn =
        getComputedStyle(container).flexDirection.startsWith("column");

    const after = isColumn
        ? e.clientY > rect.top + rect.height / 2
        : e.clientX > rect.left + rect.width / 2;

    container.insertBefore(
        draggedItem,
        after ? target.nextElementSibling : target
    );
});

container.addEventListener("dragend", () => {
    if (draggedItem) {
        draggedItem.classList.remove("dragging");
        draggedItem = null;
    }
});
document.body.addEventListener("contextmenu", e => {
    e.preventDefault();
});

loop_btn.addEventListener("click", () => {
    if (audio.loop == true) {
        audio.loop = false;
        loop_btn.classList.remove("enabled");
    } else {
        audio.loop = true;
        loop_btn.classList.add("enabled");
    }
})

