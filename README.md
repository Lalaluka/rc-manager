# rc-manager
A cli based NPM and Yarn config Manager. Store and load npmrc and yarnrc (optional) files in profiles.

## Why?
I find my self often switching between multiple private npmrc configs and Package Managers. To ease the switch between them I wrote this small tool enabling me to store and load different Profiles of not only npmrc but also yarnrc files.

The tool automatically detects if yarn is installed and if its not the case it's opts to an npm only mode.

## Usage and Installation
Install the package globally with either npm or yarn
```
npm install -g rc-manager
yarn global add rc-manager
```

After installation these possibilities 
````
  rc-manager --help                for help.
  rc-manager save <Profilename>    to save the current Configs to a new Profile
  rc-manager load <Profilename>    to load a Profile to active Configs
  rc-manager delete <Profilename>  to delete a Profile
  rc-manager list                  to list available Profiles
````

## Manual Changes
The cli tool will create a new file in your Home directory called `rc_switcher_store.json`. The cli will store the Profiles in there in the following format:
````
{
  "last_modify": <Date of last change>,
  "profiles": [
    {
      "name": "Profile Name",
      "npmrc": "npmrc File",
      "yarnrc": "yarnrc File"
    }
    ...
  ]
}
````
The config you are using during the first run of the tool will be stored as a Profile called `default`.

## Contact
Calvin Schröder <calvin-schroder@hotmail.com>

[Website](https://calvin-schroeder.de)