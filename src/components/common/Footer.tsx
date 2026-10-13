import { Trans } from "react-i18next";
import pci from "@/assets/img/security-brands/pci-security.svg";
import mastercard from "@/assets/img/security-brands/mastercard-security.svg";
import visa from "@/assets/img/security-brands/old-visa-security.svg";
import americanExpress from "@/assets/img/security-brands/american-express-security.svg";
import "@/assets/scss/common/Footer.scss";

const Footer = () => {
    const images = [pci, mastercard, visa, americanExpress];
    return (
        <footer>
            <Trans class="info" keypath="footer.info" tag="div" scope="global" />
            <div className="security-brands-wrapper">
                {
                    images.map((image, index) => (
                        <img key={index} src={image} alt="security-brand" />
                    ))
                }
            </div>
        </footer>
    )
}

export default Footer