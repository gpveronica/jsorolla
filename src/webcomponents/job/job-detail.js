/**
 * Copyright 2015-2019 OpenCB
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
import UtilsNew from "../../core/utilsNew.js";
import "./job-detail-log.js";
import "./job-view.js";
import "../commons/view/detail-tabs.js";

export default class JobDetail extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object
            },
            jobId: {
                type: String
            },
            job: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = UtilsNew.randomString(8);
        this._config = this.getDefaultConfig();
    }

    update(changedProperties) {
        if (changedProperties.has("opencgaSession") || changedProperties.has("jobId")) {
            this.jobIdObserver();
        }

        if (changedProperties.has("config")) {
            this._config = {
                ...this.getDefaultConfig(),
                ...this.config,
            };
        }

        super.update(changedProperties);
    }

    jobIdObserver() {
        if (this.opencgaSession && this.jobId) {
            this.opencgaSession.opencgaClient.jobs().info(this.jobId, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.job = response.getResult(0);
                })
                .catch(function (reason) {
                    console.error(reason);
                });
        }
    }

    render() {
        if (!this.opencgaSession || !this.job) {
            return "";
        }

        return html`
            <detail-tabs
                .data="${this.job}"
                .config="${this._config}"
                .opencgaSession="${this.opencgaSession}">
            </detail-tabs>
        `;
    }

    getDefaultConfig() {
        return {
            title: "Job",
            showTitle: true,
            items: [
                {
                    id: "job-view",
                    name: "Overview",
                    active: true,
                    render: (job, _active, opencgaSession) => html`
                        <job-view
                            .opencgaSession="${opencgaSession}"
                            mode="simple"
                            .job="${job}">
                        </job-view>
                    `,
                },
                {
                    id: "job-log",
                    name: "Logs",
                    render: (job, active, opencgaSession) => html`
                        <job-detail-log
                            .opencgaSession="${opencgaSession}"
                            .active="${active}"
                            .job="${job}">
                        </job-detail-log>
                    `,
                },
            ],
        };
    }

}

customElements.define("job-detail", JobDetail);
