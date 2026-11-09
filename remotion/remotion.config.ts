import {Config} from '@remotion/cli/config';

// Use the storefront's own photo folder as Remotion's public dir.
Config.setPublicDir('../assets');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
