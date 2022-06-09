/**
 * Copyright 2015-2022 OpenCB
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

import {LitElement, html} from "lit";
import "./clinical-analysis-browser.js";
import "../commons/tool-header.js";

export default class ClinicalAnalysisPortal extends LitElement {

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object
            },
            settings: {
                type: Object
            },
        };
    }

    renderToolbarButtons() {
        return html`
            <div>
                <button class="btn btn-info active">
                    <strong>Case Explorer</strong>
                </button>
                <button class="btn btn-info">
                    Disease Panel Explorer
                </button>

                <button class="btn btn-default" style="margin-left:16px;">
                    <i class="fas fa-plus icon-padding"></i>
                    <strong>New Case</strong>
                </button>
            </div> 
        `;
    }

    render() {
        if (!this.opencgaSession) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No public projects available to browse. Please login to continue</h3>
                </div>
            `;
        }

        return html`
            <tool-header
                .title="${this.settings?.title || "Case Portal"}"
                .icon="${this.settings?.icon || ""}"
                .rhs="${this.renderToolbarButtons()}">
            </tool-header>
            <div style="margin-top:32px;margin-bottom:24px;">
                <h2 style="font-weight:bold;">Case Explorer</h2>
            </div>
            <clinical-analysis-browser
                .opencgaSession="${this.opencgaSession}"
                .settings="${this.settings}">
            </clinical-analysis-browser>
        `;
    }

}

customElements.define("clinical-analysis-portal", ClinicalAnalysisPortal);
