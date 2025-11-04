import './toping.css'
import MenuN from './menuN';
import MenuT from './menuT';

const topings = [
    {
        topingN: '휘핑크림',
        price: 500,
    },
    {
        topingN: '초코시럽',
        price: 600,
    },
    {
        topingN: '초코',
        price: 700,
    },

]

function Toping() {
    return (
        <>
            <header>
                <p>back</p>
                <p className="title">옵션 선택</p>
            </header>
            <article>
                <section class="menuN">
                    <MenuN></MenuN>
                </section>
                <section class="menuT">
                    <p class="title">토핑</p>
                    {topings.map((toping) => {
                        return <MenuT topingN={toping.topingN} topingP={toping.price} />;
                    })}
                </section>
            </article>
            <footer>
                <button>장바구니에 담기</button>
            </footer>
        </>
    );
}

export default Toping
