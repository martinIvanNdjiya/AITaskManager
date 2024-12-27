export function pagination(pageCourante, setPageCourrante, nbPages, tableauPage) {
    return <>
        <button className="pagination-previous" onClick={() => {
            if (pageCourante === 1) {
                setPageCourrante(pageCourante)
            } else {
                setPageCourrante(pageCourante - 1)
            }
        }}
        >Previous
        </button>
        <button className="pagination-next" onClick={() => {
            if (pageCourante === nbPages() - 1) {
                setPageCourrante(pageCourante)
            } else {
                setPageCourrante(pageCourante + 1)
            }
        }}>Next page
        </button>
        <ul className="pagination-list">
            {tableauPage().map((i) => {
                if (pageCourante === i) {
                    return <li key={i} onClick={() => setPageCourrante(i)}>
                        <button className="pagination-link is-current" aria-label={`page ${i}`}>{i}</button>
                    </li>
                } else {
                    return <li key={i} onClick={() => setPageCourrante(i)}>
                        <button className="pagination-link" aria-label={`page ${i}`}>{i}</button>
                    </li>
                }
            })
            }
        </ul>
    </>;
}