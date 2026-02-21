import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
    api: {
        projectId: 'ydqudq1j',
        dataset: 'production',
    },
    deployment: {
        autoUpdates: true,
    },
})
