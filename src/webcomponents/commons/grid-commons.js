/*
 * Copyright 2015-2016 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import UtilsNew from "../../core/utilsNew.js";


export default class GridCommons {

    static GRID_ICONS_PREFIX = "fas";
    static GRID_ICONS = {
        paginationSwitchDown: "fa-caret-square-down",
        paginationSwitchUp: "fa-caret-square-up",
        refresh: "fa-sync",
        toggleOff: "fa-toggle-off",
        toggleOn: "fa-toggle-on",
        columns: "fa-th-list",
        fullscreen: "fa-arrows-alt",
        detailOpen: "fa-plus",
        detailClose: "fa-minus"
    }

    constructor(gridId, context, config) {
        this.gridId = gridId;
        this.context = context;
        this.config = config;
        this.checkedRows = new Map();
        this.selectedRow;
    }

    responseHandler(response, bootstrapTableConfig) {
        let numMatches, from, to, approximateCountResult;
        numMatches = this.context.numMatches || 0;
        if (response.getResponse().numMatches >= 0) {
            numMatches = response.getResponse().numMatches;
            this.context.numMatches = numMatches;
        }
        // If no variant is returned then we start in 0
        if (response.getResponse(0).numMatches === 0) {
            from = numMatches;
        }
        // If do not fetch as many variants as requested then to is numMatches
        if (response.getResponse(0).numResults < bootstrapTableConfig.pageSize) {
            to = numMatches;
        }
        const numTotalResultsText = numMatches.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (response.getParams().skip === 0 && numMatches < response.getParams().limit) {
            from = 1;
            to = numMatches;
        }

        if (response.getResponse()?.attributes?.approximateCount) {
            approximateCountResult = response.getResponse().attributes.approximateCount;
        }

        return {
            numMatches: numMatches,
            from: from,
            to: to,
            numTotalResultsText: numTotalResultsText,
            approximateCountResult: approximateCountResult,
            pageSize: bootstrapTableConfig.pageSize,
            response: {
                total: numMatches,
                rows: response.getResults()
            }
        };
    }

    onClickRow(rowId, row, selectedElement) {
        $("#" + this.gridId + " tr").removeClass("success");
        $(selectedElement).addClass("success");
        this.selectedRow = selectedElement;
        // $("#" + this.gridId + " tr td").removeClass("success");
        // $("td", selectedElement).addClass("success");

        this.context.dispatchEvent(new CustomEvent("selectrow", {
            detail: {
                id: rowId,
                row: row
            },
            bubbles: true,
            composed: true
        }));
    }

    onCheck(rowId, row, others) {
        // delete row.checkbox;
        this.checkedRows.set(rowId, row);
        this.context.dispatchEvent(new CustomEvent("checkrow", {
            detail: {
                id: rowId,
                row: row,
                checked: true,
                rows: Array.from(this.checkedRows.values()),
                ...others
            }
        }));
    }

    onCheckAll(rows, others) {
        for (const row of rows) {
            // delete row.checkbox;
            this.checkedRows.set(row.id, row);
        }
        this.context.dispatchEvent(new CustomEvent("checkrow", {
            detail: {
                rows: Array.from(this.checkedRows.values()),
                ...others
            }
        }));
    }

    onUncheck(rowId, row, others) {
        this.checkedRows.delete(rowId);
        this.context.dispatchEvent(new CustomEvent("checkrow", {
            detail: {
                id: rowId,
                row: row,
                checked: false,
                rows: Array.from(this.checkedRows.values()),
                ...others
            }
        }));
    }

    onUncheckAll(rows, others) {
        for (const row of rows) {
            this.checkedRows.delete(row.id);
        }
        this.context.dispatchEvent(new CustomEvent("checkrow", {
            detail: {
                rows: Array.from(this.checkedRows.values()),
                checked: false,
                ...others
            }
        }));
    }

    // TODO rename in onPostBody??
    onLoadSuccess(data, firstRowIndex = 2, idField = "id") {
        // TODO the event `selectrow` with null values is fired in case of empty result and in case of error both. Create a common method.
        if (data.rows && data.rows.length > 0) {
            const table = $("#" + this.gridId);

            if (this.checkedRows && this.checkedRows.size > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                    if (this.checkedRows.has(data.rows[i].id)) {
                        table.bootstrapTable("check", i);
                    }
                }
            }

            if (table[0]) {
                const selectedDataId = this.selectedRow?.[0]?.attributes["data-uniqueid"]?.["nodeValue"];
                const selectedData = selectedDataId ? data.rows.find(row => row?.id === selectedDataId) : null;
                if (selectedData) {
                    table.find(`tr[data-uniqueid="${selectedDataId}"]`).addClass("success");
                } else {
                    table.find("tr[data-index=0]").addClass("success");
                }
                this.context.dispatchEvent(new CustomEvent("selectrow", {
                    detail: {
                        id: selectedData ? selectedData[idField] : data.rows[0][idField],
                        row: selectedData ? selectedData : data.rows[0]
                    }
                }));
            }
        } else {
            this.context.dispatchEvent(new CustomEvent("selectrow", {
                detail: {
                    id: null,
                    row: null
                }
            }));
        }

        // This init all grid tooltips
        UtilsNew.initTooltip(this.context);
    }

    onLoadError(e, response) {
        this.context.dispatchEvent(new CustomEvent("selectrow", {
            detail: {
                id: null,
                row: null
            }
        }));

        // in some cases `response` is a string (in case the error state doesn't come from the server there is no restResponse instance, so we send a custom error msg)
        let msg = "Generic Error";
        if (response?.getEvents?.("ERROR")?.length) {
            msg = response.getEvents("ERROR").map(error => `${error.name}: ${error.message ?? ""}`).join("<br>");
        } else if (response instanceof Error) {
            msg = `<h2>${response.name}</h2><br>${response.message ?? ""}`;
        } else if (response instanceof Object) {
            msg = JSON.stringify(response);
        } else if (typeof response === "string") {
            msg = response;
        }
        this.context.table.bootstrapTable("updateFormatText", "formatNoMatches", msg);
    }

    onPageChange(page, size) {
        // this.context.from = (page - 1) * size + 1;
        // this.context.to = page * size;
        return {
            from: (page - 1) * size + 1,
            to: page * size
        };
    }

    // overrides the pagination info in bootstrap-table
    formatShowingRows(pageFrom, pageTo, totalRows, totalRowsNotTruncated, isApproximateCount) {
        const pagedFromFormatted = Number(pageFrom).toLocaleString();
        const pagedToFormatted = Number(pageTo).toLocaleString();
        let message;
        if (!totalRowsNotTruncated) {
            message = `Showing <b>${pagedFromFormatted}</b> to <b>${pagedToFormatted}</b> of <b>${Number(totalRows).toLocaleString()}</b> records`;
            if (isApproximateCount) {
                message += " <span title=\"Approximate count\" style=\"color: red; vertical-align: top; font-size: 1.0rem\"><i class=\"fas fa-asterisk fa-xs\"></i></span>";
            }
        } else {
            message = `
                Showing <b>${pagedFromFormatted}</b> to <b>${pagedToFormatted}</b> of <b>${Number(totalRowsNotTruncated).toLocaleString()}</b> records
                <span title="Only first 1M pages shown" style="color: darkorange; vertical-align: top; font-size: 1.0rem"><i class="fas fa-asterisk fa-xs"></i></span>`;
        }
        return message;
    }

    onColumnChange(e) {
        if (e.detail.selected) {
            e.detail.id.split(",").forEach(id => this.context.table.bootstrapTable("showColumn", id));
        } else {
            e.detail.id.split(",").forEach(id => this.context.table.bootstrapTable("hideColumn", id));
        }
    }

    rowHighlightStyle(row, index) {
        // If no active highlight
        if (!this.config.highlights || !this.config.activeHighlights || this.config.activeHighlights?.length === 0) {
            return {};
        }

        let rowStyle = {};
        this.config.highlights.forEach(highlight => {
            if (this.config.activeHighlights.includes(highlight.id)) {
                if (highlight.condition && highlight.condition(row, index)) {
                    rowStyle = {
                        css: {
                            "background-color": highlight.style?.rowBackgroundColor || "",
                            "opacity": highlight.style?.rowOpacity,
                        },
                    };
                }
            }
        });

        // Return background color for this row
        return rowStyle;
    }

}
