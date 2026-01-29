//src/theme/flexStyles
export const flexStyles = ({
    col: {
        center: {
            flexDirection: 'column',
            justifyColumn: 'center',
            alignItems: 'center'
        },
        endAlign: {
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'flex-end'
        },
        startAlign: {
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center'
        }
    },
    row: {
        center: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
        },
        endAlign: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end'
        },
        startAlign: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start'
        }
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center'
    }
})


