(() => {
    function updateCarousel(carousel) {
        const viewport = carousel.querySelector('.landing-thumbs-viewport');
        const strip = carousel.querySelector('.landing-thumbs-strip');
        if (!viewport || !strip) return;

        // `scrollWidth` is integer CSS px, while the rendered viewport width can be fractional.
        // Using getBoundingClientRect + ceil avoids tiny rounding that can clip the last tile.
        // scrollWidth includes strip padding-left/right (our elastic space).
        const viewportWidth = viewport.getBoundingClientRect().width;
        const maxScroll = Math.max(0, strip.scrollWidth - viewportWidth);
        const maxTranslate = -Math.ceil(maxScroll);
        strip.style.setProperty('--landing-carousel-max-translate', `${maxTranslate}px`);
    }

    function updateAll() {
        document
            .querySelectorAll('.landing-thumbs.landing-thumbs--carousel')
            .forEach(updateCarousel);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateAll, { once: true });
    } else {
        updateAll();
    }

    // Recompute after images load and on resize.
    window.addEventListener('load', updateAll, { once: true });

    let resizeScheduled = false;
    window.addEventListener('resize', () => {
        if (resizeScheduled) return;
        resizeScheduled = true;
        window.requestAnimationFrame(() => {
            resizeScheduled = false;
            updateAll();
        });
    });
})();
