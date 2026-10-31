function createTrackCard(track, { element = "div", href, target, includeInfo = false } = {}) {
    const card = document.createElement(element);
    card.className = "track";
    if (href !== undefined) {
        card.href = href;
    }
    if (target !== undefined) {
        card.target = target;
    }
    if (includeInfo) {
        card.info = track;
    }

    const image = document.createElement("img");
    image.src = track["thumbnail"];
    const details = document.createElement("div");
    const title = document.createElement("div");
    const artists = document.createElement("div");
    title.innerText = track["title"];
    artists.innerText = track["artists"];
    details.append(title, artists);
    card.append(image, details);
    return card;
}

function createAlbumCard(album) {
    const card = document.createElement("a");
    card.href = `/album-page/${album}`;
    card.className = "album";

    const image = document.createElement("img");
    image.src = `/api/thumbnail/${album}.webp`;
    const title = document.createElement("div");
    title.innerText = album;
    card.append(image, title);
    return card;
}
