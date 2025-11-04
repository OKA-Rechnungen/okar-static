function load_image(facs_id, osd_container_id, osd_container_id2){
    $('#' + osd_container_id).css({
        'height': '400px'
    });
    // OpenSeaDragon Image Viewer
    // Extract document ID from page title
    var pageTitle = document.querySelector('h1').textContent.trim();
    // Remove year prefix if present (e.g., "1574-75_WSTLA-OKA-B1-1-106-1" -> "WSTLA-OKA-B1-1-106-1")
    var docId = pageTitle.includes('_') ? pageTitle.split('_').slice(1).join('_') : pageTitle;
    
    var image = $('#' + facs_id);
    var imageFilename = image.attr('src');
    // Construct IIIF API URL
    var iiifUrl = `https://viewer.acdh.oeaw.ac.at/viewer/api/v1/records/${docId}/files/images/${imageFilename}/full/full/0/default.jpg`;
    var imageURL = {type: 'image', url: iiifUrl};
    var viewer = OpenSeadragon({
        id: osd_container_id,
        prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/2.4.1/images/',
        crossOriginPolicy: 'Anonymous',
        ajaxWithCredentials: false,
        loadTilesWithAjax: true,
        drawer: 'canvas', // Force canvas drawer instead of WebGL to avoid context loss issues
        // sequenceMode: true,
        // showReferenceStrip: true,
        // showNavigator: true,
        // imageLoaderLimit: 10,
        tileSources: imageURL
    });
    $('#' + osd_container_id2).remove();
};