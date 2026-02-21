import { type SanityConfig } from '@sanity/sdk'
import { SanityApp } from '@sanity/sdk-react'
import { ExampleComponent } from './ExampleComponent'
import './App.css'

const config: SanityConfig[] = [
    {
        projectId: 'ydqudq1j',
        dataset: 'production',
    },
]

export default function App() {
    return (
        <SanityApp config={config} fallback={<div>Loading…</div>}>
            <ExampleComponent />
        </SanityApp>
    )
}
