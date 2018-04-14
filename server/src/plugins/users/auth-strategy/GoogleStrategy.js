import { Strategy } from "passport-google-oauth20";
import {
  createRegisterMobile,
  createVerifyMobile,
  verifyWeb
} from "./StrategyUtils";

import Axios from "axios";
import config from "config";

const axios = Axios.create({
  baseURL: "https://www.googleapis.com/",
  timeout: 30e3
});

const profileWebToUser = profile => ({
  username: profile.displayName,
  email: profile.emails[0].value,
  firstName: profile.name.givenName,
  lastName: profile.name.familyName,
  picture: profile.image,
  authProvider: {
    name: "google",
    authId: profile.id
  }
});

const profileMobileToUser = profile => ({
  username: profile.name,
  email: profile.email,
  firstName: profile.givenName,
  lastName: profile.familyName,
  authProvider: {
    name: "google",
    authId: profile.id
  }
});

export async function verifyMobile(
  models,
  publisherUser,
  profile,
  accessToken
) {
  const getMe = () =>
    axios.get("userinfo/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

  return createVerifyMobile(
    getMe,
    models,
    publisherUser,
    profileMobileToUser(profile),
    accessToken
  );
}

export function registerWeb(passport, models, publisherUser) {
  const googleConfig = config.authentication.google;
  if (googleConfig) {
    const strategy = new Strategy(googleConfig, async function (
      accessToken,
      refreshToken,
      profile,
      done
    ) {
      try {
        const res = await verifyWeb(
          models,
          publisherUser,
          profileWebToUser(profile),
          accessToken
        );
        done(res.err, res.user);
      } catch (err) {
        done(err);
      }
    });
    passport.use("google", strategy);
  }
}

export function registerMobile(passport, models, publisherUser) {
  createRegisterMobile("google", verifyMobile, passport, models, publisherUser);
}
