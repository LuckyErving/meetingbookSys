module.exports = {
  appId: 'com.meetingbooksys.app',
  productName: '会议室预订系统',
  directories: {
    output: 'dist'
  },
  asar: true,
  files: [
    'build_output/**/*',
    'src/main.js',
    'src/preload.js',
    'node_modules/**/*',
    '!node_modules/.cache/**',
    '!node_modules/.vite/**',
    '!node_modules/**/test/**',
    '!node_modules/**/*.md',
    '!node_modules/**/*.ts',
    '!node_modules/**/*.map'
  ],
  extraMetadata: {
    main: 'src/main.js'
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    icon: 'public/favicon.ico',
    requestedExecutionLevel: 'asInvoker'
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'public/favicon.icns',
    category: 'public.app-category.business'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      }
    ],
    icon: 'public/favicon.png',
    category: 'Office'
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  },
  dmg: {
    background: 'public/dmg-background.png',
    iconSize: 100,
    contents: [
      {
        x: 380,
        y: 280,
        type: 'link',
        path: '/Applications'
      },
      {
        x: 110,
        y: 280,
        type: 'file'
      }
    ]
  }
};
