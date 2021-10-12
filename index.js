#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const profile_store = process.env.NPMRC_STORE || path.join(process.env.HOME || process.env.USERPROFILE, 'rc_switcher_store.json');
const npmrc = process.env.NPMRC || path.join(process.env.HOME || process.env.USERPROFILE, '.npmrc');
const yarnrc = process.env.YARNRC || path.join(process.env.HOME || process.env.USERPROFILE, '.yarnrc');

const fserror = (err) => {
  if (err) {
    console.error(err)
    return
  }
}

//check if npmrc exists
if (!fs.existsSync(npmrc)) {
  console.error("No npmrc found!")
  process.exit(1)
};
//Check if yarnrc exists
const yarnmode = (() => {
  if (!fs.existsSync(yarnrc)) {
    console.info("No yarnrc found. Using npm only mode.")
    return false
  } else {
    return true
  }
})();

//If Store does not exist create one with a default Profile storing current config
(function checkStoreExitence() {
  if (!fs.existsSync(profile_store)) {
    const npmrcFile = fs.readFileSync(npmrc).toString();
    const yarnrcFile = (() => {
      if (yarnmode) {
        return fs.readFileSync(yarnrc).toString();
      } else {
        return ""
      }
    })()
    const data = JSON.stringify({
      "last_modify": Date.now(),
      "profiles": [
        {
          "name": "default",
          "npmrc": npmrcFile,
          "yarnrc": yarnrcFile
        }
      ]
    }, null, 2);
    fs.writeFileSync(profile_store, data, fserror)
  }
}());

// Save current config as a new Profile
function saveCurrentConfig(profileName) {
  const npmrcFile = fs.readFileSync(npmrc).toString();
  const yarnrcFile = (() => {
    if (yarnmode) {
      return fs.readFileSync(yarnrc).toString();
    } else {
      return ""
    }
  })()
  let store = JSON.parse(fs.readFileSync(profile_store).toString())
  if (!store.profiles.map(x => x.name).includes(profileName)) {
    store.last_modify = Date.now();
    store.profiles.push({
      name: profileName,
      "npmrc": npmrcFile,
      "yarnrc": yarnrcFile
    })
    fs.writeFileSync(profile_store, JSON.stringify(store, null, 2), fserror)
  } else {
    console.error("Profile Key already exists!");
    process.exit(1)
  }
}

// Load Config by Profilename
function loadConfigByName(profileName) {
  const selectedProfile = JSON.parse(fs.readFileSync(profile_store).toString()).profiles.find(x => x.name === profileName);
  if (selectedProfile) {
    fs.writeFileSync(npmrc, selectedProfile.npmrc, fserror)
    if (yarnmode) {
      fs.writeFileSync(yarnrc, selectedProfile.yarnrc)
    }
  } else {
    console.error("No Profile with the Name " + profileName + " does not exist.", fserror);
    process.exit(1)
  }
}

//Delete Profile from Store
function deleteProfileByName(profileName) {
  let store = JSON.parse(fs.readFileSync(profile_store).toString())
  if (store.profiles.map(x => x.name).includes(profileName)) {
    store.last_modify = Date.now();
    store.profiles = store.profiles.filter(prop => prop.name !== profileName)
    fs.writeFileSync(profile_store, JSON.stringify(store, null, 2), fserror)
  } else {
    console.error("Profile does not exists!");
    process.exit(1)
  }
}

//List Profiles in Store
function listProfiles() {
  console.log("Available Profiles:")
  JSON.parse(fs.readFileSync(profile_store).toString()).profiles.map(function (profile) { console.log("  " + profile.name) });
}

//Show current active Profile
function showActive() {
  const npmrcFile = fs.readFileSync(npmrc).toString();
  const yarnrcFile = (() => {
    if (yarnmode) {
      return fs.readFileSync(yarnrc).toString();
    } else {
      return ""
    }
  })()
  JSON.parse(fs.readFileSync(profile_store).toString()).profiles.map(function (profile) {
    if (profile.npmrc == npmrcFile && compareYarnFiles(profile.yarnrc, yarnrcFile)) {
      console.log("Active Profile: " + profile.name)
    }
  })
}

//Comparing Yarnfiles with out the "lastUpdateCheck" line if yarnmode return true
function compareYarnFiles(yarnrcoriginal, yarnrcFile) {
  if (yarnmode) {
    let splityarnprofile = yarnrcoriginal.split("\n");
    let splityarnfile = yarnrcFile.split("\n");
    for (i = 0; i < splityarnprofile.length; i++) {
      if (!splityarnprofile[i].startsWith("lastUpdateCheck")) {
        if (splityarnprofile[i] !== splityarnfile[i]) {
          return false;
        }
      }
    }
  }
  return true;
}

const processArgs = process.argv.slice(2)

switch (processArgs[0]) {
  case "save":
    if (processArgs[1] !== undefined) {
      saveCurrentConfig(processArgs[1])
    } else {
      process.stdout.write(
        'No Profilename provided.\n'
        + '  save command follows:\n'
        + '  rc-manager save <Profilename>'
      )
      process.exit(1)
    }
    break;
  case "load":
    if (processArgs[1] !== undefined) {
      loadConfigByName(processArgs[1])
    } else {
      process.stdout.write(
        'No Profilename provided.\n'
        + '  save command follows:\n'
        + '  rc-manager load <Profilename>'
      )
      process.exit(1)
    }
    break;
  case "delete":
    if (processArgs[1] !== undefined) {
      deleteProfileByName(processArgs[1])
    } else {
      process.stdout.write(
        'No Profilename provided.\n'
        + '  save command follows:\n'
        + '  rc-manager delete <Profilename>'
      )
      process.exit(1)
    }
    break;
  case "list":
    listProfiles()
    break;
  case "current":
    showActive()
    break;
  case "--help":
    process.stdout.write(
      'rc-manager switch between npm and yarn configs\n'
      + '  rc-manager --help                for help.\n'
      + '  rc-manager save <Profilename>    to save the current Configs to a new Profile\n'
      + '  rc-manager load <Profilename>    to load a Profile to active Configs\n'
      + '  rc-manager delete <Profilename>  to delete a Profile\n'
      + '  rc-manager list                  to list available Profiles\n'
      + '  rc-manager current               show current active Profile'
    )
    break;
  default:
    process.stdout.write(
      'Command ' + processArgs[0] + ' is not supported.\n'
      + '  run --help for help.'
    )
    process.exit(1)
}
