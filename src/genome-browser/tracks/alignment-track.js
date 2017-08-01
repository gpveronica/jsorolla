class AlignmentTrack extends FeatureTrack {

    constructor(args) {
        super(args);

        //set default args
        this.retrievedAlignments = null;
        this.retrievedChunkIds = new Set();

        this.DEFAULT_EXCLUDE = "studies,annotation";

        // set user args
        Object.assign(this, args);

        this._init();
        // if (typeof this.renderer === "undefined") {
        //     this.renderer = new AlignmentRenderer(FEATURE_TYPES.alignment);
        // }
    }

    _init() {
        // Set OpenCGA adapter as default. OpenCGA Client constructor(client, category, subcategory, resource, params = {}, options = {}, handlers = {}) {
        if (typeof this.dataAdapter === "undefined" || this.dataAdapter === null) {
            if (typeof this.opencga !== "undefined" && this.opencga !== null) {
                if (this.opencga.client !== undefined && this.opencga.client !== null) {
                    this.dataAdapter = new OpencgaAdapter(this.opencga.client, "analysis/alignment", "", "query", {
                        studies: this.opencga.studies,
                        exclude: this.DEFAULT_EXCLUDE
                    }, {
                        chunkSize: 5000
                    });
                }

                if (typeof this.opencga.samples !== "undefined" && this.opencga.samples !== null && this.opencga.samples.length !== 0) {
                    this.dataAdapter.params.exclude = "studies.files,studies.stats,annotation";
                    this.dataAdapter.params.returnedSamples = this.opencga.samples;
                }
            } else {
                console.error("No 'dataAdapter' or 'opencga' object provided");
            }
        }

        // Set FeatureRenderer as default
        if (typeof this.renderer === "undefined" || this.renderer === null) {
            // FEATURE_TYPES.variant.sampleNames = this.opencga.samples;
            this.renderer = new AlignmentRenderer(FEATURE_TYPES.alignment);
        }
        this.renderer.track = this;
    }

    getDataHandler(event) {
        let features = event;
        // if (event.dataType == "histogram") {
        //     this.renderer = this.histogramRenderer;
        //     features = event.items;
        // } else {
        //     this.renderer = this.defaultRenderer;
        //     features = event;
        // }
        this.renderedArea = {}; //<- this is only in Aligments
        this.renderer.render(features, {
            cacheItems: event.items,
            svgCanvasFeatures: this.svgCanvasFeatures,
            featureTypes: this.featureTypes,
            renderedArea: this.renderedArea,
            pixelBase: this.pixelBase,
            position: this.region.center(),
            regionSize: this.region.length(),
            maxLabelRegionSize: this.maxLabelRegionSize,
            width: this.width,
            pixelPosition: this.pixelPosition,
            region: this.region,
            trackListPanel: this.trackListPanel
        });
        this.updateHeight();
    }

    draw() {
        let _this = this;

        this.svgCanvasOffset = (this.width * 3 / 2) / this.pixelBase;
        this.svgCanvasLeftLimit = this.region.start - this.svgCanvasOffset * 2;
        this.svgCanvasRightLimit = this.region.start + this.svgCanvasOffset * 2;

        this.updateHistogramParams();
        this.clean();

        this.dataType = "features";
        if (this.histogram) {
            this.dataType = "histogram";
        }

        if (typeof this.visibleRegionSize === "undefined" || this.region.length() < this.visibleRegionSize) {
            this.setLoading(true);
            this.dataAdapter.getData({
                dataType: this.dataType,
                region: new Region({
                    chromosome: this.region.chromosome,
                    start: this.region.start - this.svgCanvasOffset * 2,
                    end: this.region.end + this.svgCanvasOffset * 2
                }),
                params: {
                    histogram: this.histogram,
                    histogramLogarithm: this.histogramLogarithm,
                    histogramMax: this.histogramMax,
                    interval: this.interval
                }
            })
                .then(function(response) {
                    _this.storeRetrievedAlignments(response);
                    _this.getDataHandler(response);
                    _this.setLoading(false);
                })
                .catch(function(reason){
                    console.log("Alignment Track draw error: " + reason);
                });
            //this.invalidZoomText.setAttribute("visibility", "hidden");
        } else {
            //this.invalidZoomText.setAttribute("visibility", "visible");
        }
        _this.updateHeight();
    }

    move(disp) {
        let _this = this;

        this.dataType = "features";
        if (this.histogram) {
            this.dataType = "histogram";
        }

        _this.region.center();
        let pixelDisplacement = disp * _this.pixelBase;
        this.pixelPosition -= pixelDisplacement;

        let move = parseFloat(this.svgCanvasFeatures.getAttribute("x")) + pixelDisplacement;
        this.svgCanvasFeatures.setAttribute("x", move);

        let virtualStart = parseInt(this.region.start - this.svgCanvasOffset);
        let virtualEnd = parseInt(this.region.end + this.svgCanvasOffset);

        if (typeof this.visibleRegionSize === "undefined" || this.region.length() < this.visibleRegionSize) {

            if (disp > 0 && virtualStart < this.svgCanvasLeftLimit) {
                _this.setLoading(true);
                this.dataAdapter.getData({
                    dataType: this.dataType,
                    region: new Region({
                        chromosome: _this.region.chromosome,
                        start: parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset - 1),
                        end: this.svgCanvasLeftLimit - 1
                    }),
                    params: {
                        histogram: this.histogram,
                        histogramLogarithm: this.histogramLogarithm,
                        histogramMax: this.histogramMax,
                        interval: this.interval
                    }
                })
                    .then(function(response){
                        _this.addNewAlignments(response, "left");
                        _this.getDataHandler(_this.retrievedAlignments);
                        _this.setLoading(false);
                    })
                    .catch(function(reason){
                        console.log("Alignment Track move error: " + reason);

                    });
                this.svgCanvasLeftLimit = parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset);
            }

            if (disp < 0 && virtualEnd > this.svgCanvasRightLimit) {
                _this.setLoading(true);
                this.dataAdapter.getData({
                    dataType: this.dataType,
                    region: new Region({
                        chromosome: _this.region.chromosome,
                        start: this.svgCanvasRightLimit + 1,
                        end: parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset + 1)
                    }),
                    params: {
                        histogram: this.histogram,
                        histogramLogarithm: this.histogramLogarithm,
                        histogramMax: this.histogramMax,
                        interval: this.interval
                    }
                })
                    .then(function(response){
                        _this.addNewAlignments(response, "right");
                        _this.getDataHandler(_this.retrievedAlignments);
                        _this.setLoading(false);

                    })
                    .catch(function(reason){
                        console.log("Alignment Track move error: " + reason);

                    });
                this.svgCanvasRightLimit = parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset);
            }
        }
    }

    _removeDisplayedChunks(response) {
        //Returns an array avoiding already drawn features in this.chunksDisplayed

        let getChunkId = function (position) {
            return Math.floor(position / response.chunkSize);
        };
        let getChunkKey = function (chromosome, chunkId) {
            return `${chromosome}:${chunkId}_${response.dataType}_${response.chunkSize}`;
        };

        let chunks = response.items;
        let newChunks = [];

        let feature, displayed, featureFirstChunk, featureLastChunk, features = [];
        for (let i = 0, leni = chunks.length; i < leni; i++) { //loop over chunks
            if (this.chunksDisplayed[chunks[i].chunkKey] != true) { //check if any chunk is already displayed and skip it

                features = []; //initialize array, will contain features not drawn by other drawn chunks
                let alignments = chunks[i].value.alignments;
                if (alignments == null) {
                    alignments = chunks[i].value;
                }
                for (let j = 0, lenj = alignments.length; j < lenj; j++) {
                    feature = alignments[j];

                    //check if any feature has been already displayed by another chunk
                    displayed = false;
                    featureFirstChunk = getChunkId(feature.start);
                    featureLastChunk = getChunkId(feature.end);
                    for (let chunkId = featureFirstChunk; chunkId <= featureLastChunk; chunkId++) { //loop over chunks touched by this feature
                        let chunkKey = getChunkKey(feature.chromosome, chunkId);
                        if (this.chunksDisplayed[chunkKey] == true) {
                            displayed = true;
                            break;
                        }
                    }
                    if (!displayed) {
                        features.push(feature);
                    }
                }
                this.chunksDisplayed[chunks[i].chunkKey] = true;
                chunks[i].value.alignments = features; //update features array
                newChunks.push(chunks[i]);
            }
        }
        response.items = newChunks;
        return response;
    }

    storeRetrievedAlignments(event) {
        if (event.dataType === "histogram") {
            return;
        }

        this.retrievedAlignments = event;

        // Update real left and right limits
        this.svgCanvasLeftLimit = event.items[0].region.start;
        this.svgCanvasRightLimit = event.items[event.items.length - 1].region.end;

        this.retrievedChunkIds = new Set();
        for (let i = 0; i < event.items.length; i++) {
            this.retrievedChunkIds.add(event.items[i].chunkKey);
        }
    }

    addNewAlignments(event, position) {
        if (event.dataType === "histogram") {
            return;
        }

        if (position === "right") {
            for (let i = 0; i < event.items.length; i++) {
                if (this.retrievedChunkIds.has(event.items[i].chunkKey)) {
                    // We should not call several times to the webservices asking for regions we already have
                } else {
                    this.retrievedChunkIds.add(event.items[i].chunkKey);
                    this.retrievedAlignments.items.push(event.items[i]);
                }
            }

            // Dispose of far away items from the left
            while (this.retrievedAlignments.items[0].region.end < this.region.start - this.svgCanvasOffset) {
                let chunkKey = this.retrievedAlignments.items[0].chunkKey;
                console.log(`Dispose region ${chunkKey}`);
                this.retrievedChunkIds.delete(chunkKey);
                this.retrievedAlignments.items.splice(0, 1);
            }
        } else { // left
            // this.retrievedAlignments.items.unshift(event.items);
            for (let i = event.items.length - 1; i >= 0; i--) {
                if (this.retrievedChunkIds.has(event.items[i].chunkKey)) {
                    // We should not call several times to the webservices asking for regions we already have
                    // debugger;
                } else {
                    this.retrievedChunkIds.add(event.items[i].chunkKey);
                    this.retrievedAlignments.items.unshift(event.items[i]);
                }
            }

            // Dispose of far away items from the right
            while (this.retrievedAlignments.items[this.retrievedAlignments.items.length - 1].region.start >
            this.region.end + this.svgCanvasOffset) {
                let chunkKey = this.retrievedAlignments.items[this.retrievedAlignments.items.length - 1].chunkKey;
                console.log(`Dispose region ${chunkKey}`);
                this.retrievedChunkIds.delete(chunkKey);
                this.retrievedAlignments.items.splice(this.retrievedAlignments.items.length - 1, 1);
            }

        }

        // Update canvas limits
        this.svgCanvasLeftLimit = this.retrievedAlignments.items[0].region.start;
        this.svgCanvasRightLimit = this.retrievedAlignments.items[this.retrievedAlignments.items.length - 1].region.end;
    }
}
