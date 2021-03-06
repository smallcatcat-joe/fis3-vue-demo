var getModulePath = require('./fis/utils.js').getModulePath;
var ignoreModulePaths = require('./fis/ignore.module.config.js');
var modulePaths = require('./fis/module.config.js');

var autoprefixerOption = {
  browsers: [
    "> 5%",
    "last 4 versions"
  ]
};

////////////////////资源发布配置////////////////////

fis.config.set('wwwPath', './build');
fis.set('project.files', ['src/**', 'node_modules/**']);
fis.set('project.ignore', fis.get('project.ignore').concat([
  '**.md',
  '**.json',
  '**.sh'
]));
fis.set('project.md5Length', 8);

//测试打包
fis.media('dev_test')
    .match('*', {
      deploy: fis.plugin('local-deliver', {
        to: fis.config.get('wwwPath')
      })
    });

//上线打包
fis.media('prod')
    .match('*.{js,vue}', {
      optimizer: fis.plugin('uglify-js', {
          compress: {
              warnings: false,
              drop_console: true
          }
      })
    })
    .match('/src/**.css', {
      postprocessor: fis.plugin('autoprefixer', autoprefixerOption)
    })
    .match('*.{js,css,png}', {
      //md5，控制缓存
      useHash: true
    })
    .match('*', {
      deploy: fis.plugin('local-deliver', {
        to: fis.config.get('wwwPath')
      })
    });

////////////////////资源优化////////////////////

// 开启对css中的图片合并
fis.match('*.css', {
    useSprite: true
});

// 雪碧图合并的最小间隔
fis.config.set('settings.spriter.csssprites.margin', 5);

// 雪碧图拼合方式为矩形
fis.config.set('settings.spriter.csssprites.layout', 'matrix');

// 开启图片压缩
fis.match('*.png', {
  // fis-optimizer-png-compressor 插件进行压缩，已内置
  optimizer: fis.plugin('png-compressor')
});

// 如果要兼容低版本ie显示透明png图片，请使用pngquant作为图片压缩器，
// 否则png图片透明部分在ie下会显示灰色背景
// 使用spmx release命令时，添加--optimize或-o参数即可生效
fis.config.set('settings.optimzier.png-compressor.type', 'pngquant');

//////////////////资源编译处理//////////////////

//浏览器css添加前缀兼容
fis.match('/src/**.css', {
  postprocessor: fis.plugin('autoprefixer', autoprefixerOption)
})

// //sass编译
// fis.match('*.scss', {
//   rExt: '.css',
//   parser: fis.plugin('node-sass')
// })

// es6编译
fis.match('/src/**.js', {
  parser: fis.plugin('babel-6.x')
});

//vue单文件编译以及es6编译
fis.match('/src/**.vue', {
  isMod: true,
  useSameNameRequire: true,
  parser: [
    fis.plugin('vue-component', {
      runtimeOnly: true,
      extractCSS: true,
      cssScopedFlag: null
    }),
    fis.plugin('babel-6.x')
  ],
  rExt: '.js'
});

////////////////////模块化开发////////////////////

//用amd方式包装模块
fis.hook('module' , {
    mode: 'amd',
    // 把 factory 中的依赖，前置到 define 的第二个参数中来。
    forwardDeclaration: true,
    paths: modulePaths
});

//模块化文件配置
fis.match('/src/**.js', {
    isMod: true
});

fis.match('/src/**.vue', {
    isMod: true
});

fis.match('/node_modules/**.js', {
    isMod: true,
    useHash: false
});

// require.js本身不需要模块化，否则报错
fis.match('/node_modules/requirejs/require.js', {
    isMod: false,
    useHash: false
});

////////////////////打包配置////////////////////

//打包配置
fis.match('::packager', {
    // npm install [-g] fis3-postpackager-loader
    // 分析 __RESOURCE_MAP__ 结构，来解决资源加载问题
    postpackager: fis.plugin('loader', {
        resourceType: 'amd',
        allInOne: {
            js: '${filepath}_aio.js',
            css: '${filepath}_aio.css',
            includeAsyncs: true, // 包含异步加载的模块
            ignore: ignoreModulePaths
        },
        scriptPlaceHolder: '<!--SCRIPT_PLACEHOLDER-->',
        useInlineMap: true // 资源映射表内嵌
    })
});
