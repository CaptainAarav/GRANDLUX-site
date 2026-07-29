import React from 'react';
import './Downloads.css'

function Downloads() {
    return (
        <div className="downloads-container">
            <section className="downloads-section">
                <h1 className="downloads-title">Downloads</h1>
                <p className="downloads-desc">Here you find all necessary resources to become a member and operate GLX Aircraft. Please note that we reserve the right to all documents, no documents shall be reuploaded without permission from the staff team if you have any questions contact us via our discord support tool or via mail at: <a href="mailto:info@grandlux.lu">info@grandlux.lu</a></p>
            </section>
            <section className="downloads-section">
                <h1 className="downloads-title">Checklists</h1>
                <div className="checklists-downloads-container">
                    <section className="checklists-downloads-title">
                        <h2 className="airline-checklist-downloads-title">Airbus</h2>
                        <button className="download-button">
                            <i className="fa-regular fa-folder"></i>
                            <p className="download-button-text">Airbus A320 Family</p>
                        </button>
                    </section>
                    <section className="checklists-downloads-title">
                        <h2 className="airline-checklist-downloads-title">Boeing</h2>
                        <button className="download-button">
                            <i className="fa-regular fa-folder"></i>
                            <p className="download-button-text">Boeing 737-800</p>
                        </button>
                    </section>
                </div>
            </section>
        </div>
    )
}

export default Downloads