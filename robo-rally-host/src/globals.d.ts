declare global {
    interface Window {
        mainAPI: {
            connectRobot: (name: string) => void
            getIP: () => Promise<string|undefined>
        }
    }

    const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
    const MAIN_WINDOW_VITE_NAME: string
}
