import {CellBaseClient} from "../core/clients/cellbase/cellbase-client.js";
import Region from "../core/bioinfo/region.js";
import Utils from "../core/utils.js";
import UtilsNew from "../core/utilsNew.js";
import TrackListPanel from "./tracks/tracklist-panel.js";
import FeatureTrack from "./tracks/feature-track.js";
import NavigationBar from "./navigation-bar.js";
import KaryotypePanel from "./karyotype-panel.js";
import ChromosomePanel from "./chromosome-panel.js";
import StatusBar from "./status-bar.js";
import FeatureRenderer from "./renderers/feature-renderer.js";
import GenomeBrowserConstants from "./genome-browser-constants.js";


export default class GenomeBrowser {

    constructor(target, config) {
        // eslint-disable-next-line no-undef
        Object.assign(this, Backbone.Events);

        this.id = UtilsNew.randomString(8);
        this.config = {...GenomeBrowser.getDefaultConfig(), ...config};

        // Initialize target element: can be an HTMLElement reference or an ID selector
        this.target = target instanceof HTMLElement ? target : document.querySelector(`#${target}`);

        this.version = "Powered by <a target=\"_blank\" href=\"http://www.opencb.org/\">OpenCB</a>";
        this.chromosomes = {};
        this.zoom = 1;
        this.width = this.config.width || 1;
        this.height = this.config.height || 1;

        // Initialize CellBase client
        if (this.config.cellBaseClient) {
            this.cellBaseClient = this.config.cellBaseClient;
        } else {
            // Initialize a new cellbase client with the host and version from config
            this.cellBaseClient = new CellBaseClient({
                host: this.config.cellBaseHost,
                version: this.config.cellBaseVersion,
                cache: {
                    active: false,
                },
            });
        }

        this.sidePanelWidth = this.config.sidePanel ? 25 : 0;

        this.region = this.config.region;
        this._checkAndSetMinimumRegion(this.region, this.getSVGCanvasWidth());
        this.defaultRegion = new Region(this.region);

        this.fullscreen = false;
        this.resizing = false;

        this.changingRegion = false;

        this.rendered = false;
        if (this.autoRender) {
            this.render();
        }
    }

    render() {
        console.log("Initializing Genome Viewer");

        // HTML skel
        this.div = document.createElement("div");
        this.div.setAttribute("id", this.id);
        this.div.setAttribute("class", "ocb-gv ocb-box-vertical");

        this.navigationbarDiv = document.createElement("div");
        this.navigationbarDiv.setAttribute("class", "ocb-gv-navigation");
        this.div.appendChild(this.navigationbarDiv);

        this.centerPanelDiv = document.createElement("div");
        this.centerPanelDiv.setAttribute("class", "ocb-gv-center");
        this.div.appendChild(this.centerPanelDiv);

        this.statusbarDiv = document.createElement("div");
        this.statusbarDiv.setAttribute("class", "ocb-gv-status");
        this.div.appendChild(this.statusbarDiv);


        this.rightSidebarDiv = document.createElement("div");
        this.rightSidebarDiv.setAttribute("class", "ocb-gv-right-side");
        this.centerPanelDiv.appendChild(this.rightSidebarDiv);

        this.leftSidebarDiv = document.createElement("div");
        this.leftSidebarDiv.setAttribute("class", "ocb-gv-left-side");
        this.centerPanelDiv.appendChild(this.leftSidebarDiv);


        this.karyotypeDiv = document.createElement("div");
        this.karyotypeDiv.setAttribute("class", "ocb-gv-karyotype");
        this.centerPanelDiv.appendChild(this.karyotypeDiv);

        this.chromosomeDiv = document.createElement("div");
        this.chromosomeDiv.setAttribute("class", "ocb-gv-chromosome");
        this.centerPanelDiv.appendChild(this.chromosomeDiv);


        this.trackListPanelsDiv = document.createElement("div");
        this.trackListPanelsDiv.setAttribute("class", "ocb-gv-tracklist-target");
        this.centerPanelDiv.appendChild(this.trackListPanelsDiv);

        this.regionDiv = document.createElement("div");
        this.regionDiv.setAttribute("class", "ocb-gv-overview");
        this.trackListPanelsDiv.appendChild(this.regionDiv);

        this.tracksDiv = document.createElement("div");
        this.tracksDiv.setAttribute("class", "ocb-gv-detailed");
        this.trackListPanelsDiv.appendChild(this.tracksDiv);

        if (this.drawOverviewTrackListPanel) {
            this.overviewTrackListPanel = this._createOverviewTrackListPanel(this.regionDiv);
        }
        this.trackListPanel = this._createTrackListPanel(this.tracksDiv);

        // Import chromosomes and initialize GB
        this.getChromosomes().then(() => {
            return this._init();
        });
    }

    _init() {
        // this._checkAndSetMinimumRegion(this.region, this.getSVGCanvasWidth());
        this.zoom = this._calculateZoomByRegion(this.region);
        this._updateSpecies(this.config.species);

        // Create Navigation Bar
        if (this.config.drawNavigationBar) {
            this.navigationBar = this._createNavigationBar(this.navigationbarDiv);
        }

        // Create karyotype Panel
        if (this.config.drawKaryotypePanel) {
            this.karyotypePanel = this._drawKaryotypePanel(this.karyotypeDiv);
        }

        // Create Chromosome panel
        if (this.config.drawChromosomePanel) {
            this.chromosomePanel = this._drawChromosomePanel(this.chromosomeDiv);
        }

        // Create status bar
        if (this.config.drawStatusBar) {
            this.statusBar = this._createStatusBar(this.statusbarDiv);
        }

        // Register event listeners
        this.on("region:change region:move", event => {
            if (event.sender !== this) {
                this.region.load(event.region);
            }
        });
        this.on("width:change", event => {
            if (event.sender !== this) {
                this.width = event.width;
                this.div.style.width = event.width;
                this.target.style.width = event.width;
                // $(this.div).width(event.width);
                // $(this.targetDiv).width(event.width);
            }
        });

        // TODO: fix an alternative to $.bind
        // TODO: event.keyCode is deprecated, we should replace it when event.key
        // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
        $("html").bind("keydown.genomeViewer", event => {
            switch (event.keyCode) {
                // ArrowDown or "-" keys
                case 40:
                case 109:
                    if (event.shiftKey) {
                        this.increaseZoom(-10);
                    }
                    break;
                    // ArrowUp or "+" keys
                case 38:
                case 107:
                    if (event.shiftKey) {
                        this.increaseZoom(10);
                    }
                    break;
            }
        });
    }

    draw() {
        // this.targetDiv = (this.target instanceof HTMLElement) ? this.target : document.querySelector('#' + this.target);
        if (!this.target) {
            console.log("target not found");
            return;
        }
        this.target.appendChild(this.div);
    }

    destroy() {
        while (this.div.firstChild) {
            this.div.removeChild(this.div.firstChild);
        }
        $(this.div).remove();
        this.off();
        this.rendered = false;
        $("html").unbind(".genomeViewer");
        $("body").unbind(".genomeViewer");
        delete this;
    }

    // Get chromosomes from CellBase
    // Returns a promise that will resolve when chromosomes have been loaded
    getChromosomes() {
        // Generate a chromosomes map using the chromosone name as key
        const saveChromosomes = chromosomeList => {
            return Object.fromEntries(chromosomeList.map(chromosome => {
                return [chromosome.name, chromosome];
            }));
        };

        if (this.config.chromosomeList?.length > 0) {
            // Chromosomes list has been provided in the configuration
            this.chromosomes = saveChromosomes(this.config.chromosomeList);
            return Promise.resolve();
        } else {
            // Import chromosomes from cellbase
            return this.cellBaseClient.get("genomic", "chromosome", undefined, "search").then(res => {
                this.chromosomes = saveChromosomes(res.responses[0].results[0].chromosomes);
            });
        }
    }

    _createNavigationBar(target) {
        let quickSearchResultFn = this.config.quickSearchResultFn;
        if (typeof quickSearchResultFn !== "function") {
            quickSearchResultFn = query => {
                return this.cellBaseClient.get("feature", "id", query, "starts_with", {limit: 10});
            };
        }

        // Helper method to center in the specified feature region
        const goToFeature = feature => this._regionChangeHandler({region: new Region(feature)});

        // TODO: change initialization of NavigationBar
        // TODO: fix configuration values
        const navigationBar = new NavigationBar(target, {
            cellBaseClient: this.cellBaseClient,
            cellBaseHost: this.config.cellBaseHost,
            cellBaseVersion: this.config.cellBaseVersion,
            availableSpecies: this.config.availableSpecies,
            species: this.species,
            region: this.region,
            width: this.width,
            svgCanvasWidthOffset: this.trackPanelScrollWidth + this.sidePanelWidth,
            zoom: this.zoom,
            quickSearchResultFn: this.quickSearchResultFn,
            quickSearchDisplayKey: this.quickSearchDisplayKey,
            componentsConfig: this.navigationBarConfig.componentsConfig,
            karyotypePanelConfig: this.karyotypePanelConfig,
            chromosomePanelConfig: this.chromosomePanelConfig,
            regionPanelConfig: this.regionPanelConfig,
        });

        // Register event listeners
        navigationBar.on("region:change", event => this._regionChangeHandler(event));
        navigationBar.on("region:move", event => this._regionMoveHandler(event));
        navigationBar.on("zoom:change", event => this._zoomChangeHandler(event));
        navigationBar.on("species:change", event => this._speciesChangeHandler(event));
        navigationBar.on("karyotype-button:change", event => {
            event.selected ? this.karyotypePanel.show() : this.karyotypePanel.hide();
        });
        navigationBar.on("chromosome-button:change", event => {
            event.selected ? this.chromosomePanel.show() : this.chromosomePanel.hide();
        });
        navigationBar.on("region-button:change", event => {
            event.selected ? this.overviewTrackListPanel.show() : this.overviewTrackListPanel.hide();
        });
        navigationBar.on("fullscreen:click", () => {
            // TODO: move this to a separate function called toggleFullScreen
            if (this.fullscreen) {
                $(this.div).css({width: "auto"});
                Utils.cancelFullscreen(); // no need to pass the dom object;
            } else {
                $(this.div).css({width: screen.width});
                Utils.launchFullScreen(this.div);
            }
            this.fullscreen = !this.fullscreen; // Change fullscreen
        });
        navigationBar.on("restoreDefaultRegion:click", event => {
            this._regionChangeHandler({...event, region: this.defaultRegion});
        });
        navigationBar.on("autoHeight-button:change", event => this.toggleAutoHeight(event.selected));
        navigationBar.on("quickSearch:select", event => {
            goToFeature(event.item);
            this.trigger("quickSearch:select", event);
        });
        navigationBar.on("quickSearch:go", event => goToFeature(event.item));

        // Listen to events in GB
        this.on("region:change", event => navigationBar.setRegion(event.region, this.zoom));
        this.on("region:move", event => {
            if (event.sender != navigationBar) {
                navigationBar.moveRegion(event.region);
            }
        });
        this.on("width:change", event => navigationBar.setWidth(event.width));

        // Draw navigation bar
        navigationBar.draw();

        return navigationBar;
    }

    _drawKaryotypePanel(target) {
        const karyotypePanel = new KaryotypePanel(target, {
            cellBaseClient: this.cellBaseClient,
            cellBaseHost: this.config.cellBaseHost,
            cellBaseVersion: this.config.cellBaseVersion,
            width: this.width - this.sidePanelWidth,
            height: 125,
            species: this.species,
            title: "Karyotype",
            collapsed: this.config.karyotypePanelConfig.collapsed,
            collapsible: this.config.karyotypePanelConfig.collapsible,
            hidden: this.config.karyotypePanelConfig.hidden,
            region: this.region,
            autoRender: true,
        });

        // Register event listeners
        karyotypePanel.on("region:change", event => this._regionChangeHandler(event));

        // Listen to GB events
        this.on("region:change region:move", event => karyotypePanel.setRegion(event.region));
        this.on("width:change", event => karyotypePanel.setWidth(event.width - this.sidePanelWidth));

        // Draw karyotype panel
        karyotypePanel.draw();

        return karyotypePanel;
    }

    _drawChromosomePanel(target) {
        const chromosomePanel = new ChromosomePanel(target, {
            cellBaseClient: this.cellBaseClient,
            cellBaseHost: this.config.cellBaseHost,
            cellBaseVersion: this.config.cellBaseVersion,
            autoRender: true,
            width: this.width - this.sidePanelWidth,
            height: 65,
            species: this.species,
            title: "Chromosome",
            collapsed: this.config.chromosomePanelConfig.collapsed,
            collapsible: this.config.chromosomePanelConfig.collapsible,
            hidden: this.config.chromosomePanelConfig.hidden,
            region: this.region,
        });

        // Register chromosome panel event listeners
        chromosomePanel.on("region:change", event => this._regionChangeHandler(event));

        // Listen to GB events
        this.on("region:change region:move", event => chromosomePanel.setRegion(event.region));
        this.on("width:change", event => chromosomePanel.setWidth(event.width - this.sidePanelWidth));

        // Render chromosome panel
        chromosomePanel.draw();

        return chromosomePanel;
    }

    _createOverviewTrackListPanel(target) {
        const trackListPanel = new TrackListPanel(target, {
            CellBaseClient: this.cellBaseClient,
            cellBaseHost: this.config.cellBaseHost,
            cellBaseVersion: this.config.cellBaseVersion,
            autoRender: true,
            width: this.width - this.sidePanelWidth,
            zoomMultiplier: this.overviewZoomMultiplier,
            title: "Region overview",
            showRegionOverviewBox: true,
            collapsible: this.config.regionPanelConfig?.collapsible,
            region: this.region,
            species: this.species,
        });

        // Register overview track list event listeners
        trackListPanel.on("region:change", event => this._regionChangeHandler(event));
        trackListPanel.on("region:move", event => this._regionMoveHandler(event));

        // Listen to GB events
        this.on("region:change", event => {
            if (event.sender !== trackListPanel) {
                trackListPanel.setRegion(event.region);
            }
        });
        this.on("region:move", event => {
            if (event.sender !== trackListPanel) {
                trackListPanel.moveRegion(event);
            }
        });
        this.on("width:change", event => trackListPanel.setWidth(event.width - this.sidePanelWidth));

        // Draw track list panel
        trackListPanel.draw();

        return trackListPanel;
    }

    _createTrackListPanel(target) {
        const trackListPanel = new TrackListPanel(target, {
            cellBaseClient: this.cellBaseClient,
            cellBaseHost: this.config.cellBaseHost,
            cellBaseVersion: this.config.cellBaseVersion,
            autoRender: true,
            width: this.width - this.sidePanelWidth,
            title: this.config.trackListTitle,
            region: this.region,
            species: this.species,
            hidden: this.config.regionPanelConfig.hidden,
        });

        // Register event listeners
        trackListPanel.on("region:change", event => this._regionChangeHandler(event));
        trackListPanel.on("region:move", event => this._regionMoveHandler(event));

        // Listen to GB events
        this.on("region:change", event => {
            if (event.sender !== trackListPanel) {
                trackListPanel.setRegion(event.region);
            }
        });
        this.on("region:move", event => {
            if (event.sender !== trackListPanel) {
                trackListPanel.moveRegion(event);
            }
        });
        this.on("width:change", event => trackListPanel.setWidth(event.width - this.sidePanelWidth));
        this.on("feature:highlight", event => trackListPanel.highlight(event));

        // Draw tracklist
        trackListPanel.draw();

        return trackListPanel;
    }

    _createStatusBar(target) {
        const statusBar = new StatusBar(target, {
            autoRender: true,
            region: this.region,
            width: this.width,
            version: this.version
        });

        // Listen to events in GB
        this.on("region:change", event => statusBar.setRegion(event));

        // Listen to events in tracklistPanel
        this.trackListPanel.on("mousePosition:change", event => statusBar.setMousePosition(event));

        // Draw status bar
        statusBar.draw();
        return statusBar;
    }

    //
    // Private helpers
    //
    _checkAndSetNewChromosomeRegion(region) {
        if (this.chromosomes && this.chromosomes[region.chromosome]) {
            const chr = this.chromosomes[region.chromosome];
            if (region.chromosome !== this.region.chromosome) {
                if (region.start > chr.size || region.end > chr.size) {
                    // eslint-disable-next-line no-param-reassign
                    region.start = Math.round(chr.size / 2);
                    // eslint-disable-next-line no-param-reassign
                    region.end = Math.round(chr.size / 2);
                }
            }
        }
    }

    _checkAndSetMinimumRegion(region, width) {
        const minLength = Math.floor(width / 10);
        if (region.length() < minLength) {
            const centerPosition = region.center();
            const aux = Math.ceil((minLength / 2) - 1);
            // eslint-disable-next-line no-param-reassign
            region.start = Math.floor(centerPosition - aux);
            // eslint-disable-next-line no-param-reassign
            region.end = Math.floor(centerPosition + aux);
        }
    }

    _calculateRegionByZoom(zoom) {
        const minNtPixels = 10; // 10 is the minimum pixels per nt
        const chr = this.chromosomes[this.region.chromosome];
        const minRegionLength = this.getSVGCanvasWidth() / minNtPixels;
        const zoomLevelMultiplier = Math.pow(chr.size / minRegionLength, 0.01); // 0.01 = 1/100  100 zoom levels
        const regionLength = minRegionLength * (Math.pow(zoomLevelMultiplier, 100 - zoom)); // invert   100 - zoom
        const centerPosition = this.region.center();
        const aux = Math.ceil((regionLength / 2) - 1);

        return {
            start: Math.floor(centerPosition - aux),
            end: Math.floor(centerPosition + aux),
        };
    }

    _calculateZoomByRegion(region) {
        const minNtPixels = 10; // 10 is the minimum pixels per nt
        const minRegionLength = this.getSVGCanvasWidth() / minNtPixels;

        let zoomLevelMultiplier = 0.01;
        if (this.chromosomes && this.chromosomes[region.chromosome]) {
            const chr = this.chromosomes[region.chromosome];
            zoomLevelMultiplier = Math.pow(chr.size / minRegionLength, 0.01); // 0.01 = 1/100  100 zoom levels
        }
        const regionLength = region.length();

        const zoom = Math.log(regionLength / minRegionLength) / Math.log(zoomLevelMultiplier);
        return 100 - Math.round(zoom);
    }

    _checkChangingRegion() {
        if (this.overviewTrackListPanel && !this.overviewTrackListPanel.checkTracksReady()) {
            return false;
        }
        if (this.trackListPanel && !this.trackListPanel.checkTracksReady()) {
            return false;
        }
        return true;
    }

    //
    // EVENT METHODS
    //

    _regionChangeHandler(event) {
        if (this._checkChangingRegion()) {

            this._checkAndSetNewChromosomeRegion(event.region);
            this._checkAndSetMinimumRegion(event.region, this.getSVGCanvasWidth());
            this.zoom = this._calculateZoomByRegion(event.region);
            // Relaunch
            this.trigger("region:change", event);
            /**/
            return true;
        } else {
            if (event.sender) {
                if (event.sender.updateRegionControls) {
                    event.sender.updateRegionControls();
                }
            }
            // console.log('****************************');
            // console.log('**************************** region change already in progress');
            // console.log('****************************');
            return false;
        }
    }

    _regionMoveHandler(event) {
        this.trigger("region:move", event);
    }

    _zoomChangeHandler(event) {
        this.zoom = Math.min(100, Math.max(0, event.zoom));
        this.region.load(this._calculateRegionByZoom(event.zoom));
        this.setRegion(this.region);
    }

    _speciesChangeHandler(event) {
        this.trigger("species:change", event);
        this._updateSpecies(event.species);

        const args = {
            category: "feature",
            subcategory: "gene",
            resource: "first",
            species: event.species,
            params: {
                include: "chromosome,start,end",
            },
        };

        this.cellBaseClient.getOldWay(args)
            .then(response =>{
                const firstGeneRegion = response.response[0].result[0];
                const region = new Region(firstGeneRegion);
                this.setRegion(region);
            })
            .catch(e => {
                console.error(e);
                console.error("Cellbase host not available. Genome-browser.js fail. _speciesChangeHandler");
            });
    }

    // TODO: register event listeners in panels instead of doing this
    _updateSpecies(species) {
        this.species = species;
        // this.chromosomes = this.getChromosomes();
        this.species.chromosomes = this.chromosomes;

        if (this.overviewTrackListPanel) {
            this.overviewTrackListPanel.setSpecies(species);
        }
        if (this.trackListPanel) {
            this.trackListPanel.setSpecies(species);
        }
        if (this.chromosomePanel) {
            this.chromosomePanel.setSpecies(species);
        }
        if (this.karyotypePanel) {
            this.karyotypePanel.setSpecies(species);
        }
        if (this.navigationBar) {
            this.navigationBar.setSpecies(species);
        }
    }

    _getSpeciesByTaxonomy(taxonomyCode) {
        // find species object
        // let speciesObject = null;
        if (taxonomyCode) {
            for (let i = 0; i < this.availableSpecies.items.length; i++) {
                for (let j = 0; j < this.availableSpecies.items[i].items.length; j++) {
                    const species = this.availableSpecies.items[i].items[j];
                    const taxonomy = Utils.getSpeciesCode(species.scientificName);
                    if (taxonomy === taxonomyCode) {
                        // speciesObject = species;
                        // break;
                        return species;
                    }
                }
            }
        }
        // return speciesObject;
        return null;
    }

    //
    // API METHODS
    //

    setSpeciesByTaxonomy(taxonomyCode) {
        const species = this._getSpeciesByTaxonomy(taxonomyCode);
        if (species !== null) {
            this._speciesChangeHandler({species: species});
        } else {
            console.log("Species taxonomy not found on availableSpecies.");
        }
    }

    setRegion(region, taxonomy) {
        if (taxonomy) {
            const species = this._getSpeciesByTaxonomy(taxonomy);
            this._updateSpecies(species);
        }
        return this._regionChangeHandler({region: new Region(region)});
    }

    moveRegion(disp) {
        this.region.start += disp;
        this.region.end += disp;
        this.trigger("region:move", {region: this.region, disp: -disp, sender: this});
    }

    // TODO: use events instead of calling the setWidth method of each panel
    setWidth(width) {
        const newRegion = new Region(this.region);
        const newLength = width * this.region.length() / this.width;
        const centerPosition = this.region.center();
        const aux = Math.ceil((newLength / 2) - 1);
        newRegion.start = Math.floor(centerPosition - aux);
        newRegion.end = Math.floor(centerPosition + aux);

        this.width = width;

        if (this.overviewTrackListPanel) {
            this.overviewTrackListPanel.setWidth(width);
        }
        if (this.trackListPanel) {
            this.trackListPanel.setWidth(width);
        }
        if (this.chromosomePanel) {
            this.chromosomePanel.setWidth(width);
        }
        if (this.karyotypePanel) {
            this.karyotypePanel.setWidth(width);
        }
        if (this.navigationBar) {
            this.navigationBar.setWidth(width);
        }

        this._regionChangeHandler({region: newRegion});
    }

    setZoom(zoom) {
        this.zoom = Math.min(100, Math.max(0, zoom));
        this.region.load(this._calculateRegionByZoom(zoom));
        this.setRegion(this.region);
    }

    increaseZoom(increment) {
        this.setZoom(this.zoom + increment);
    }

    // We need this method?
    // setCellBaseHost(host) {
    //     if (host !== this.cellBaseHost) {
    //         this.cellBaseHost = host;
    //         this.navigationBar.setCellBaseHost(this.cellBaseHost);
    //         this.chromosomePanel.setCellBaseHost(this.cellBaseHost);
    //         this.karyotypePanel.setCellBaseHost(this.cellBaseHost);
    //         this.trackListPanel.setCellBaseHost(this.cellBaseHost);
    //         this.overviewTrackListPanel.setCellBaseHost(this.cellBaseHost);

    //         this._updateSpecies(this.species);
    //         this.setRegion(new Region(this.region));
    //     }
    // }

    getSVGCanvasWidth() {
        return this.width - this.trackPanelScrollWidth - this.sidePanelWidth;
    }

    mark(args) {
        const attrName = args.attrName || "feature_id";
        const cssClass = args.class || "ocb-feature-mark";
        if (typeof args.attrValues !== "undefined") {
            [args.attrValues].flat().forEach(key => {
                // TODO: Use a native document selector instead of using jquery
                $(`rect[${attrName} ~= ${args.attrValues[key]}]`).attr("class", cssClass);
            });
        }
    }

    unmark(args) {
        const attrName = args.attrName || "feature_id";
        if (typeof args.attrValues !== "undefined") {
            [args.attrValues].flat().forEach(key => {
                // TODO: Use a native document selector instead of using jquery
                $(`rect[${attrName} ~= ${args.attrValues[key]}]`).attr("class", "");
            });
        }
    }

    highlight(args) {
        this.trigger("feature:highlight", args);
    }

    // TODO: use native alternatives instead of jquery
    getRightSidePanelId() {
        return $(this.rightSidebarDiv).attr("id");
    }

    getLeftSidePanelId() {
        return $(this.leftSidebarDiv).attr("id");
    }

    getNavigationPanelId() {
        return $(this.navigationbarDiv).attr("id");
    }

    getStatusPanelId() {
        return $(this.statusbarDiv).attr("id");
    }

    setNavigationBar(navigationBar) {
        this.navigationBar = Object.assign(navigationBar, {
            availableSpecies: this.availableSpecies,
            species: this.species,
            region: this.region,
            width: this.width,
            svgCanvasWidthOffset: this.trackPanelScrollWidth + this.sidePanelWidth,
        });
        // TODO: this must be improved
        navigationBar.render(this.getNavigationPanelId());
    }

    toggleAutoHeight(bool) {
        this.trackListPanel.toggleAutoHeight(bool);
        this.overviewTrackListPanel.toggleAutoHeight(bool);
    }

    updateHeight() {
        this.trackListPanel.updateHeight();
        this.overviewTrackListPanel.updateHeight();
    }

    setSpeciesVisible(bool) {
        this.navigationBar.setSpeciesVisible(bool);
    }

    setChromosomesVisible(bool) {
        this.navigationBar.setChromosomeMenuVisible(bool);
    }

    setKaryotypePanelVisible(bool) {
        this.karyotypePanel.setVisible(bool);
        this.navigationBar.setVisible({"karyotype": bool});
    }

    setChromosomePanelVisible(bool) {
        this.chromosomePanel.setVisible(bool);
        this.navigationBar.setVisible({"chromosome": bool});
    }

    setRegionOverviewPanelVisible(bool) {
        this.overviewTrackListPanel.setVisible(bool);
        this.navigationBar.setVisible({"region": bool});
    }

    setRegionTextBoxVisible(bool) {
        this.navigationBar.setRegionTextBoxVisible(bool);
    }

    setSearchVisible(bool) {
        this.navigationBar.setSearchVisible(bool);
    }

    setFullScreenVisible(bool) {
        this.navigationBar.setFullScreenButtonVisible(bool);
    }

    // Track management
    addOverviewTrack(track) {
        this.overviewTrackListPanel.addTrack(track);
    }

    addTrack(track) {
        this.trackListPanel.addTrack(track);
    }

    getTrackById(trackId) {
        return this.trackListPanel.getTrackById(trackId);
    }

    removeTrack(track) {
        return this.trackListPanel.removeTrack(track);
    }

    restoreTrack(track, index) {
        return this.trackListPanel.restoreTrack(track, index);
    }

    setTrackIndex(track, newIndex) {
        return this.trackListPanel.setTrackIndex(track, newIndex);
    }

    scrollToTrack(track) {
        return this.trackListPanel.scrollToTrack(track);
    }

    showTrack(track) {
        this.trackListPanel.showTrack(track);
    }

    hideTrack(track) {
        this.trackListPanel.hideTrack(track);
    }

    containsTrack(track) {
        return this.trackListPanel.containsTrack(track);
    }

    containsTrackById(trackId) {
        return !!this.getTrackById(trackId);
    }

    deleteTracksCache() {
        this.overviewTrackListPanel.deleteTracksCache();
        this.trackListPanel.deleteTracksCache();
    }

    // TODO - DEPRECATED
    checkRenderedTrack(trackId) {
        console.log("DEPRECATED METHOD");
        console.log(this.checkRenderedTrack);
        this.trackExists(trackId);
    }

    // Get default configuration for GenomeBrowser
    static getDefaultConfig() {
        return {
            // General configuration
            autoRender: true,
            resizable: true,
            region: null,
            width: 1,
            height: 1,

            // CellBase configuration
            cellBaseClient: null,
            cellBaseHost: GenomeBrowserConstants.CELLBASE_HOST,
            cellBaseVersion: GenomeBrowserConstants.CELLBASE_VERSION,

            // TO REVIEW
            sidePanel: false,
            trackListTitle: "Detailed information",
            trackPanelScrollWidth: 18,

            drawStatusBar: true,
            drawNavigationBar: true,
            navigationBarConfig: {},
            drawKaryotypePanel: true,
            drawChromosomePanel: true,
            drawOverviewTrackListPanel: true,
            overviewZoomMultiplier: 8,
            karyotypePanelConfig: {
                hidden: false,
                collapsed: false,
                collapsible: true,
            },
            chromosomePanelConfig: {
                hidden: false,
                collapsed: false,
                collapsible: true,
            },
            regionPanelConfig: {
                hidden: false,
                collapsed: false,
                collapsible: true,
            },

            quickSearchResultFn: null,
            quickSearchDisplayKey: "name",

            species: [],
            availableSpecies: [],
        };
    }

}
