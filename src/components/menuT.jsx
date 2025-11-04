import './toping.css'

function MenuT({ topingN, topingP }) {
    return (
        <>
            <div>
                <div>
                    <p>{topingN}</p>
                    <p>+{topingP}원</p>
                </div>
                <div class="buttonD">
                    <button>-</button>
                    <p>0</p>
                    <button>+</button>
                </div>
            </div>
        </>
    );
}

export default MenuT
