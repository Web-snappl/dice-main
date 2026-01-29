//src/home/Home.jsx
import Container from '@components/layout/container'
import Hero from './Hero'
import Navbar from './Navbar'
import UrbanProperties from './UrbanProperties'
import Exclusive from './Exclusive'
import Discover from './Discover'
import Footer from './Footer'
import HeroMobile from './HeroMobile'

const HomePage = () => {
    return (
        <Container spacing={0}>
            <Navbar />
            <Hero />
            <HeroMobile />
            <UrbanProperties />
            <Exclusive />
            <Discover />
            <Footer />
        </Container>
    );
}
export default HomePage
