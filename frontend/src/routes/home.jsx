import DisplayListings from "../components/DisplayListings";
import { Text } from "../components/GlobalStyles/StyleText";
import {
  HomeContainer,
  HomeWelcome,
  HomeLogin,
  HomeWrapper,
} from "../components/GlobalStyles/StyleHome";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../AuthContext";

export default function HomePage() {
  const { isAuth } = useAuth();

  return (
    <HomeContainer>
      <HomeWrapper $justify={isAuth ? "center" : "space-between"}>
        <HomeWelcome>
          <Text>
            <h2>Welcome to Fox Body Swap Meet</h2>
            <p>
              We are a community of automotive enthusiasts, passionate about
              '79-'93 Ford Mustangs and the 5.0L legacy. Fox Body Swap Meet is
              the online destination for buying and selling new and used parts
              for Fox Body Mustangs. Get started today and start looking for
              what you need for your project!
            </p>
            <ul>
              <h3>New here? Visit our...</h3>
              <li>
                <a href="./aboutus">
                  <strong>About Us</strong>
                </a>{" "}
                page for more on who we are
              </li>
              <li>
                <a href="./howitworks">
                  <strong>How It Works</strong>
                </a>{" "}
                page for more on how it works at Fox Body Swap Meet
              </li>
              {/* <li>
                <strong>About Fox Body Mustangs</strong> for more on what makes
                these cars so great
              </li> */}
            </ul>
          </Text>
        </HomeWelcome>
        {isAuth ? null : (
          <HomeLogin>
            <LoginForm />
          </HomeLogin>
        )}
      </HomeWrapper>
      <DisplayListings />
    </HomeContainer>
  );
}
