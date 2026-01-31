const Space = ({ pixels, vh, children }) => {
    return (
        <div style={{ width: pixels ? `${pixels}px` : (vh ? `${vh}vh` : '0px') }} >

        </div>
    )
}

export default Space