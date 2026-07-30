import './Downloads.css'

function Downloads() {
    return (
        <div className="downloads-page">
            <div className="downloads-container">
                <section className="downloads-section">
                    <h1 className="downloads-title">Downloads</h1>
                    <p className="downloads-desc">Here you find all necessary resources to become a member and operate GLX Aircraft. Please note that we reserve the right to all documents, no documents shall be reuploaded without permission from the staff team if you have any questions contact us via our discord support tool or via mail at: <a className="email-link" href="mailto:info@grandlux.lu">info@grandlux.lu</a></p>
                </section>
                <section className="downloads-section">
                    <h1 className="downloads-title">Checklists</h1>
                    <div className="checklists-downloads-container">
                        <section className="airline-checklist-downloads-container">
                            <h2 className="airline-checklist-downloads-title">Airbus</h2>
                            <a className="download-button" href="/downloads/a320-checklist-grandlux.pdf" download>
                                <i className="fa-regular fa-folder"></i>
                                <p className="download-button-text">Airbus A320 Family</p>
                            </a>
                        </section>
                        <section className="airline-checklist-downloads-container">
                            <h2 className="airline-checklist-downloads-title">Boeing</h2>
                            <a className="download-button" href="/downloads/b737-800-checklist-grandlux.pdf" download>
                                <i className="fa-regular fa-folder"></i>
                                <p className="download-button-text">Boeing 737-800</p>
                            </a>
                        </section>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Downloads