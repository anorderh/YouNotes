function wrapVideo(video) {
    if (video.parentNode.className != 'video-container') {
        console.log('wrapping');
        // Create & insert container.
        const container = document.createElement('div');
        container.className = 'video-container';
        video.parentNode.insertBefore(container, video);

        // Modify video.
        video.classList.add('grabbed-video');

        // Put video inside container.
        container.appendChild(video);

        // Add sidebar.
        const sidepanel = document.createElement('div');
        sidepanel.className = 'sidepanel';
        container.style = 'width: 300px';
        container.appendChild(sidepanel);
    } else {
        console.log('denied bc container is already there');
    }
}

function adjustHeight(container, moviePlayer) {
    // Set container's dimensions to movie player.
    const rect = moviePlayer.getBoundingClientRect();
    container.style.height = `${rect.height}px`;
    container.style.width = `${rect.width}px`;
}

// Place panels to right of video elements.
const observer = new MutationObserver((mutations, observe) => {
    // Wrap video in new container.
    const video = document.querySelector('video');
    if (video) {
        wrapVideo(video);
    } else {
        console.log('denied bc video is not present');
    }

    // Adjust movie player's height.
    const moviePlayer = document.getElementById('movie_player');
    var containers = document.getElementsByClassName('video-container');
    if (containers.length > 0) {
        adjustHeight(containers[0], moviePlayer);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});
