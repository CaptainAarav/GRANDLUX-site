import React from 'react'
import './Downloads.css'

const categories = [
    {
        name: 'Airbus',
        files: [{ label: 'Airbus A320 Family', file: '/downloads/a320-checklist-grandlux.pdf' }],
    },
    {
        name: 'Boeing',
        files: [{ label: 'Boeing 737-800', file: '/downloads/b737-800-checklist-grandlux.pdf' }],
    },
    {
        name: 'Coming soon',
        files: [{ label: 'Placeholder' }],
    },
]

function Downloads() {
    return (
        <section className="downloads-section">
            <h1 className="downloads-title">Downloads</h1>
            <p className="downloads-intro">
                Here you find all necessary resources to become a member and operate GLX Aircraft.
                Please note that we reserve the right to all documents, no documents shall be
                reuploaded without permission from the staff team if you have any questions contact
                us via our discord support tool or via mail at:{' '}
                <a className="downloads-mail" href="mailto:info@grandlux.lu">info@grandlux.lu</a>
            </p>

            <h2 className="downloads-heading">Checklists</h2>

            <div className="downloads-grid">
                {categories.map((category) => (
                    <article className="downloads-card" key={category.name}>
                        <h3 className="downloads-card-name">{category.name}</h3>
                        <ul className="downloads-list">
                            {category.files.map((item) => (
                                <li key={item.label}>
                                    {item.file ? (
                                        <a className="downloads-link" href={item.file} download>
                                            {item.label}
                                        </a>
                                    ) : (
                                        <span className="downloads-link-empty">{item.label}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    )
}

export default Downloads
