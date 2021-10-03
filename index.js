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
if(!fs.existsSync(npmrc)){
  console.error("No npmrc found!")
  process.exit(1)
};
//Check if yarnrc exists
const yarnmode = (() => {
  if(!fs.existsSync(yarnrc)){
    console.info("No yarnrc found. Using npm only mode.")
    return false
  } else {
    return true
  }
})();

//If Store does not exist create one with a default Profile storing current config
(function checkStoreExitence(){
  if(!fs.existsSync(profile_store)){
    //read current npmrc
    const npmrcFile = fs.readFileSync(npmrc).toString();
    const yarnrcFile = (()=> {
      if(yarnmode){
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
function saveCurrentConfig(profileName){
  const npmrcFile = fs.readFileSync(npmrc).toString();
  const yarnrcFile = (()=> {
    if(yarnmode){
      return fs.readFileSync(yarnrc).toString();
    } else {
      return ""
    }
  })()
  let store = JSON.parse(fs.readFileSync(profile_store).toString())
  if(!store.profiles.map(x => x.name).includes(profileName)){
    store.last_modify = Date.now();
    store.profiles.push({
      name: profileName,
      "npmrc": npmrcFile,
      "yarnrc": yarnrcFile
    })
    fs.writeFileSync(profile_store, JSON.stringify(store, null, 2), fserror)
  } else {
    console.error("Profile Key allready exists!");
    process.exit(1)
  }
}

// Load Config by Profilename
function loadConfigByName(profileName){
  const selectedProfile = JSON.parse(fs.readFileSync(profile_store).toString()).profiles.find(x => x.name === profileName);
  if(selectedProfile){
    fs.writeFileSync(npmrc, selectedProfile.npmrc, fserror)
    if(yarnmode){
      fs.writeFileSync(yarnrc, selectedProfile.yarnrc)
    }
  } else {
    console.error("No Profile with the Name "+profileName+" does not exist.", fserror);
    process.exit(1)
  }
}

//Delete Profile from Store
function deleteProfileByName(profileName){
  let store = JSON.parse(fs.readFileSync(profile_store).toString())
  if(store.profiles.map(x => x.name).includes(profileName)){
    store.last_modify = Date.now();
    store.profiles = store.profiles.filter(prop => prop.name !== profileName)
    fs.writeFileSync(profile_store, JSON.stringify(store, null, 2), fserror)
  } else {
    console.error("Profile does not exists!");
    process.exit(1)
  }
}

const processArgs = process.argv.slice(2)

switch(processArgs[0]) {
  case "save":
    if(processArgs[1]!==undefined){
      saveCurrentConfig(processArgs[1])
    } else {
      process.stdout.write(
        'No Profilename provided.\n'
        + '  save command follows:\n'
        + '  rcmanager save <Profilename>'
      )
      process.exit(1)
    }
    break;
  case "load":
    if(processArgs[1]!==undefined){
      loadConfigByName(processArgs[1])
    } else {
      process.stdout.write(
        'No Profilename provided.\n'
        + '  save command follows:\n'
        + '  rcmanager load <Profilename>'
      )
      process.exit(1)
    }
    break;
  case "delete":
    if(processArgs[1]!==undefined){
      deleteProfileByName(processArgs[1])
    } else {
      process.stdout.write(
        'No Profilename provided.\n'
        + '  save command follows:\n'
        + '  rcmanager delete <Profilename>'
      )
      process.exit(1)
    }
    break;
  case "--help":
    process.stdout.write(
      'rcmanager switch between npm and yarn configs\n'
      + '  rcmanager --help                for help.\n'
      + '  rcmanager save <Profilename>    to save the current Configs to a new Profile\n'
      + '  rcmanager load <Profilename>    to load a Profile to active Configs\n'
      + '  rcmanager delete <Profilename>  to delete a Profile'
    )
    break;
  default:
    process.stdout.write(
      'Command ' + processArgs[0] + ' is not supported.\n'
      + '  run --help for help.'
    )
    process.exit(1)
}
