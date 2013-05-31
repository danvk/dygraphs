  


<!DOCTYPE html>
<html>
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# githubog: http://ogp.me/ns/fb/githubog#">
    <meta charset='utf-8'>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>dygraphs/dygraph-combined.js at master · danvk/dygraphs · GitHub</title>
    <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="GitHub" />
    <link rel="fluid-icon" href="https://github.com/fluidicon.png" title="GitHub" />
    <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-114.png" />
    <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114.png" />
    <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-144.png" />
    <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144.png" />
    <link rel="logo" type="image/svg" href="http://github-media-downloads.s3.amazonaws.com/github-logo.svg" />
    <meta name="msapplication-TileImage" content="/windows-tile.png">
    <meta name="msapplication-TileColor" content="#ffffff">

    
    
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />

    <meta content="authenticity_token" name="csrf-param" />
<meta content="l5042aS/KaLTbDV8BfjL/+Titz0qoDcBQEl6l3n7y/4=" name="csrf-token" />

    <link href="https://a248.e.akamai.net/assets.github.com/assets/github-1c6e7f693fab5e9ef3d504dbd2a14c2e301b1ad7.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="https://a248.e.akamai.net/assets.github.com/assets/github2-baebc37fb76929295926c0a3aa868e1ad10e392a.css" media="screen" rel="stylesheet" type="text/css" />
    


      <script src="https://a248.e.akamai.net/assets.github.com/assets/frameworks-898c2db1f151d566cfe6a57c33338e30b3b75033.js" type="text/javascript"></script>
      <script src="https://a248.e.akamai.net/assets.github.com/assets/github-55d0b25fa303ea9d12ca9678c949b97dc38300cb.js" type="text/javascript"></script>
      
      <meta http-equiv="x-pjax-version" content="a4063be6720bc486a1e55846f7a71ea3">

        <link data-pjax-transient rel='permalink' href='/danvk/dygraphs/blob/870190b5b5ad4e2ee930d14ac1c5d0e2be6f8fe0/dygraph-combined.js'>
    <meta property="og:title" content="dygraphs"/>
    <meta property="og:type" content="githubog:gitrepository"/>
    <meta property="og:url" content="https://github.com/danvk/dygraphs"/>
    <meta property="og:image" content="https://secure.gravatar.com/avatar/a2aaa6cd108f9a803ec61e20d76963f1?s=420&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png"/>
    <meta property="og:site_name" content="GitHub"/>
    <meta property="og:description" content="Interactive visualizations of time series using JavaScript and the HTML canvas tag. Issue tracker at http://code.google.com/p/dygraphs/issues/list"/>
    <meta property="twitter:card" content="summary"/>
    <meta property="twitter:site" content="@GitHub">
    <meta property="twitter:title" content="danvk/dygraphs"/>

    <meta name="description" content="Interactive visualizations of time series using JavaScript and the HTML canvas tag. Issue tracker at http://code.google.com/p/dygraphs/issues/list" />

  <link href="https://github.com/danvk/dygraphs/commits/master.atom" rel="alternate" title="Recent Commits to dygraphs:master" type="application/atom+xml" />

  </head>


  <body class="logged_out page-blob  vis-public env-production  ">
    <div id="wrapper">

      

      

      

      


        <div class="header header-logged-out">
          <div class="container clearfix">

            <a class="header-logo-wordmark" href="https://github.com/">
              <img alt="GitHub" class="github-logo-4x" height="30" src="https://a248.e.akamai.net/assets.github.com/images/modules/header/logov7@4x.png?1338945075" />
              <img alt="GitHub" class="github-logo-4x-hover" height="30" src="https://a248.e.akamai.net/assets.github.com/images/modules/header/logov7@4x-hover.png?1338945075" />
            </a>

              
<ul class="top-nav">
    <li class="explore"><a href="https://github.com/explore">Explore GitHub</a></li>
  <li class="search"><a href="https://github.com/search">Search</a></li>
  <li class="features"><a href="https://github.com/features">Features</a></li>
    <li class="blog"><a href="https://github.com/blog">Blog</a></li>
</ul>


            <div class="header-actions">
                <a class="button primary" href="https://github.com/signup">Sign up for free</a>
              <a class="button" href="https://github.com/login?return_to=%2Fdanvk%2Fdygraphs%2Fblob%2Fmaster%2Fdygraph-combined.js">Sign in</a>
            </div>

          </div>
        </div>


      

      


            <div class="site hfeed" itemscope itemtype="http://schema.org/WebPage">
      <div class="hentry">
        
        <div class="pagehead repohead instapaper_ignore readability-menu ">
          <div class="container">
            <div class="title-actions-bar">
              


<ul class="pagehead-actions">



    <li>
      <a href="/login?return_to=%2Fdanvk%2Fdygraphs"
        class="minibutton js-toggler-target star-button entice tooltipped upwards"
        title="You must be signed in to use this feature" rel="nofollow">
        <span class="mini-icon mini-icon-star"></span>Star
      </a>
      <a class="social-count js-social-count" href="/danvk/dygraphs/stargazers">
        904
      </a>
    </li>
    <li>
      <a href="/login?return_to=%2Fdanvk%2Fdygraphs"
        class="minibutton js-toggler-target fork-button entice tooltipped upwards"
        title="You must be signed in to fork a repository" rel="nofollow">
        <span class="mini-icon mini-icon-fork"></span>Fork
      </a>
      <a href="/danvk/dygraphs/network" class="social-count">
        160
      </a>
    </li>
</ul>

              <h1 itemscope itemtype="http://data-vocabulary.org/Breadcrumb" class="entry-title public">
                <span class="repo-label"><span>public</span></span>
                <span class="mega-icon mega-icon-public-repo"></span>
                <span class="author vcard">
                  <a href="/danvk" class="url fn" itemprop="url" rel="author">
                  <span itemprop="title">danvk</span>
                  </a></span> /
                <strong><a href="/danvk/dygraphs" class="js-current-repository">dygraphs</a></strong>
              </h1>
            </div>

            
  <ul class="tabs">
    <li><a href="/danvk/dygraphs" class="selected" highlight="repo_source repo_downloads repo_commits repo_tags repo_branches">Code</a></li>
    <li><a href="/danvk/dygraphs/network" highlight="repo_network">Network</a></li>
    <li><a href="/danvk/dygraphs/pulls" highlight="repo_pulls">Pull Requests <span class='counter'>3</span></a></li>


      <li><a href="/danvk/dygraphs/wiki" highlight="repo_wiki">Wiki</a></li>


    <li><a href="/danvk/dygraphs/graphs" highlight="repo_graphs repo_contributors">Graphs</a></li>


  </ul>
  
<div class="tabnav">

  <span class="tabnav-right">
    <ul class="tabnav-tabs">
          <li><a href="/danvk/dygraphs/tags" class="tabnav-tab" highlight="repo_tags">Tags <span class="counter blank">0</span></a></li>
    </ul>
    
  </span>

  <div class="tabnav-widget scope">


    <div class="select-menu js-menu-container js-select-menu js-branch-menu">
      <a class="minibutton select-menu-button js-menu-target" data-hotkey="w" data-ref="master">
        <span class="mini-icon mini-icon-branch"></span>
        <i>branch:</i>
        <span class="js-select-button">master</span>
      </a>

      <div class="select-menu-modal-holder js-menu-content js-navigation-container js-select-menu-pane">

        <div class="select-menu-modal js-select-menu-pane">
          <div class="select-menu-header">
            <span class="select-menu-title">Switch branches/tags</span>
            <span class="mini-icon mini-icon-remove-close js-menu-close"></span>
          </div> <!-- /.select-menu-header -->

          <div class="select-menu-filters">
            <div class="select-menu-text-filter">
              <input type="text" id="commitish-filter-field" class="js-select-menu-text-filter js-filterable-field js-navigation-enable" placeholder="Filter branches/tags">
            </div> <!-- /.select-menu-text-filter -->
            <div class="select-menu-tabs">
              <ul>
                <li class="select-menu-tab">
                  <a href="#" data-tab-filter="branches" class="js-select-menu-tab">Branches</a>
                </li>
                <li class="select-menu-tab">
                  <a href="#" data-tab-filter="tags" class="js-select-menu-tab">Tags</a>
                </li>
              </ul>
            </div><!-- /.select-menu-tabs -->
          </div><!-- /.select-menu-filters -->

          <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket css-truncate" data-tab-filter="branches" data-filterable-for="commitish-filter-field" data-filterable-type="substring">


              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/checked_reference/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="checked_reference" rel="nofollow" title="checked_reference">checked_reference</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/css/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="css" rel="nofollow" title="css">css</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/gh-pages/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="gh-pages" rel="nofollow" title="gh-pages">gh-pages</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target selected">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/master/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="master" rel="nofollow" title="master">master</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/plotter-option/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="plotter-option" rel="nofollow" title="plotter-option">plotter-option</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/pluggable-renderer/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="pluggable-renderer" rel="nofollow" title="pluggable-renderer">pluggable-renderer</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/plugin-test/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="plugin-test" rel="nofollow" title="plugin-test">plugin-test</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/reorganize-points/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="reorganize-points" rel="nofollow" title="reorganize-points">reorganize-points</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/revert_sigfigs/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="revert_sigfigs" rel="nofollow" title="revert_sigfigs">revert_sigfigs</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/ticker/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="ticker" rel="nofollow" title="ticker">ticker</a>
              </div> <!-- /.select-menu-item -->
              <div class="select-menu-item js-navigation-item js-navigation-target ">
                <span class="select-menu-item-icon mini-icon mini-icon-confirm"></span>
                <a href="/danvk/dygraphs/blob/two_axes/dygraph-combined.js" class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target" data-name="two_axes" rel="nofollow" title="two_axes">two_axes</a>
              </div> <!-- /.select-menu-item -->

              <div class="select-menu-no-results js-not-filterable">Nothing to show</div>
          </div> <!-- /.select-menu-list -->


          <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket css-truncate" data-tab-filter="tags" data-filterable-for="commitish-filter-field" data-filterable-type="substring">


            <div class="select-menu-no-results js-not-filterable">Nothing to show</div>

          </div> <!-- /.select-menu-list -->

        </div> <!-- /.select-menu-modal -->
      </div> <!-- /.select-menu-modal-holder -->
    </div> <!-- /.select-menu -->

  </div> <!-- /.scope -->

  <ul class="tabnav-tabs">
    <li><a href="/danvk/dygraphs" class="selected tabnav-tab" highlight="repo_source">Files</a></li>
    <li><a href="/danvk/dygraphs/commits/master" class="tabnav-tab" highlight="repo_commits">Commits</a></li>
    <li><a href="/danvk/dygraphs/branches" class="tabnav-tab" highlight="repo_branches" rel="nofollow">Branches <span class="counter ">11</span></a></li>
  </ul>

</div>

  
  
  


            
          </div>
        </div><!-- /.repohead -->

        <div id="js-repo-pjax-container" class="container context-loader-container" data-pjax-container>
          


<!-- blob contrib key: blob_contributors:v21:c90a659dbc3b632b6a4b69f3b25e2a82 -->
<!-- blob contrib frag key: views10/v8/blob_contributors:v21:c90a659dbc3b632b6a4b69f3b25e2a82 -->


<div id="slider">
    <div class="frame-meta">

      <p title="This is a placeholder element" class="js-history-link-replace hidden"></p>

        <div class="breadcrumb">
          <span class='bold'><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/danvk/dygraphs" class="js-slide-to" data-branch="master" data-direction="back" itemscope="url"><span itemprop="title">dygraphs</span></a></span></span><span class="separator"> / </span><strong class="final-path">dygraph-combined.js</strong> <span class="js-zeroclipboard zeroclipboard-button" data-clipboard-text="dygraph-combined.js" data-copied-hint="copied!" title="copy to clipboard"><span class="mini-icon mini-icon-clipboard"></span></span>
        </div>

      <a href="/danvk/dygraphs/find/master" class="js-slide-to" data-hotkey="t" style="display:none">Show File Finder</a>


        
  <div class="commit file-history-tease">
    <img class="main-avatar" height="24" src="https://secure.gravatar.com/avatar/930266f7c280533446df855091109c64?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
    <span class="author"><span rel="author">Dan Vanderkam</span></span>
    <time class="js-relative-date" datetime="2012-07-05T19:13:02-07:00" title="2012-07-05 19:13:02">July 05, 2012</time>
    <div class="commit-title">
        <a href="/danvk/dygraphs/commit/f830f81b06d83c2f85dbc7e769fdcea3dbae941b" class="message">revert combined</a>
    </div>

    <div class="participation">
      <p class="quickstat"><a href="#blob_contributors_box" rel="facebox"><strong>8</strong> contributors</a></p>
          <a class="avatar tooltipped downwards" title="danvk" href="/danvk/dygraphs/commits/master/dygraph-combined.js?author=danvk"><img height="20" src="https://secure.gravatar.com/avatar/a2aaa6cd108f9a803ec61e20d76963f1?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="20" /></a>
    <a class="avatar tooltipped downwards" title="nealie" href="/danvk/dygraphs/commits/master/dygraph-combined.js?author=nealie"><img height="20" src="https://secure.gravatar.com/avatar/deeef1bd0918332f1a9dc441a3e97aa0?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="20" /></a>
    <a class="avatar tooltipped downwards" title="joshuagould" href="/danvk/dygraphs/commits/master/dygraph-combined.js?author=joshuagould"><img height="20" src="https://secure.gravatar.com/avatar/fec238a60095a73bcb32e7a52297b923?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="20" /></a>
    <a class="avatar tooltipped downwards" title="yko" href="/danvk/dygraphs/commits/master/dygraph-combined.js?author=yko"><img height="20" src="https://secure.gravatar.com/avatar/a6f8c3d0bcea9fcf4ab0a67ce38c7e90?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="20" /></a>
    <a class="avatar tooltipped downwards" title="eklitzke" href="/danvk/dygraphs/commits/master/dygraph-combined.js?author=eklitzke"><img height="20" src="https://secure.gravatar.com/avatar/c8e31cd07007fe6695dbc51069ab9fdc?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="20" /></a>
    <a class="avatar tooltipped downwards" title="beda42" href="/danvk/dygraphs/commits/master/dygraph-combined.js?author=beda42"><img height="20" src="https://secure.gravatar.com/avatar/ebdcc08481deb9e4263932aae8db8e97?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="20" /></a>
    <a class="avatar tooltipped downwards" title="ecurran" href="/danvk/dygraphs/commits/master/dygraph-combined.js?author=ecurran"><img height="20" src="https://secure.gravatar.com/avatar/5d23a8d906715612fc932da8beebc9be?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="20" /></a>
    <a class="avatar tooltipped downwards" title="potter" href="/danvk/dygraphs/commits/master/dygraph-combined.js?author=potter"><img height="20" src="https://secure.gravatar.com/avatar/df71cf0f1eaf6bb4d0f2015ecd9ce7b4?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="20" /></a>


    </div>
    <div id="blob_contributors_box" style="display:none">
      <h2>Users on GitHub who have contributed to this file</h2>
      <ul class="facebox-user-list">
        <li>
          <img height="24" src="https://secure.gravatar.com/avatar/a2aaa6cd108f9a803ec61e20d76963f1?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
          <a href="/danvk">danvk</a>
        </li>
        <li>
          <img height="24" src="https://secure.gravatar.com/avatar/deeef1bd0918332f1a9dc441a3e97aa0?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
          <a href="/nealie">nealie</a>
        </li>
        <li>
          <img height="24" src="https://secure.gravatar.com/avatar/fec238a60095a73bcb32e7a52297b923?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
          <a href="/joshuagould">joshuagould</a>
        </li>
        <li>
          <img height="24" src="https://secure.gravatar.com/avatar/a6f8c3d0bcea9fcf4ab0a67ce38c7e90?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
          <a href="/yko">yko</a>
        </li>
        <li>
          <img height="24" src="https://secure.gravatar.com/avatar/c8e31cd07007fe6695dbc51069ab9fdc?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
          <a href="/eklitzke">eklitzke</a>
        </li>
        <li>
          <img height="24" src="https://secure.gravatar.com/avatar/ebdcc08481deb9e4263932aae8db8e97?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
          <a href="/beda42">beda42</a>
        </li>
        <li>
          <img height="24" src="https://secure.gravatar.com/avatar/5d23a8d906715612fc932da8beebc9be?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
          <a href="/ecurran">ecurran</a>
        </li>
        <li>
          <img height="24" src="https://secure.gravatar.com/avatar/df71cf0f1eaf6bb4d0f2015ecd9ce7b4?s=140&amp;d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png" width="24" />
          <a href="/potter">potter</a>
        </li>
      </ul>
    </div>
  </div>


    </div><!-- ./.frame-meta -->

    <div class="frames">
      <div class="frame" data-permalink-url="/danvk/dygraphs/blob/870190b5b5ad4e2ee930d14ac1c5d0e2be6f8fe0/dygraph-combined.js" data-title="dygraphs/dygraph-combined.js at master · danvk/dygraphs · GitHub" data-type="blob">

        <div id="files" class="bubble">
          <div class="file">
            <div class="meta">
              <div class="info">
                <span class="icon"><b class="mini-icon mini-icon-text-file"></b></span>
                <span class="mode" title="File Mode">file</span>
                  <span>8 lines (5 sloc)</span>
                <span>0.328 kb</span>
              </div>
              <div class="actions">
                <div class="button-group">
                      <a class="minibutton js-entice" href=""
                         data-entice="You must be signed in and on a branch to make or propose changes">Edit</a>
                  <a href="/danvk/dygraphs/raw/master/dygraph-combined.js" class="button minibutton " id="raw-url">Raw</a>
                    <a href="/danvk/dygraphs/blame/master/dygraph-combined.js" class="button minibutton ">Blame</a>
                  <a href="/danvk/dygraphs/commits/master/dygraph-combined.js" class="button minibutton " rel="nofollow">History</a>
                </div><!-- /.button-group -->
              </div><!-- /.actions -->

            </div>
                <div class="data type-javascript js-blob-data">
      <table cellpadding="0" cellspacing="0" class="lines">
        <tr>
          <td>
            <pre class="line_numbers"><span id="L1" rel="#L1">1</span>
<span id="L2" rel="#L2">2</span>
<span id="L3" rel="#L3">3</span>
<span id="L4" rel="#L4">4</span>
<span id="L5" rel="#L5">5</span>
<span id="L6" rel="#L6">6</span>
<span id="L7" rel="#L7">7</span>
</pre>
          </td>
          <td width="100%">
                  <div class="highlight"><pre><div class='line' id='LC1'><span class="nx">This</span> <span class="nx">is</span> <span class="nx">not</span> <span class="nx">the</span> <span class="nx">file</span> <span class="nx">you</span> <span class="nx">are</span> <span class="nx">looking</span> <span class="k">for</span><span class="p">.</span></div><div class='line' id='LC2'><span class="nx">A</span> <span class="nx">reasonably</span> <span class="nx">up</span><span class="o">-</span><span class="nx">to</span><span class="o">-</span><span class="nx">date</span> <span class="nx">version</span> <span class="nx">can</span> <span class="nx">be</span> <span class="nx">found</span> <span class="nx">at</span> <span class="nx">http</span><span class="o">:</span><span class="c1">//dygraphs.com/dygraph-combined.js</span></div><div class='line' id='LC3'><br/></div><div class='line' id='LC4'><span class="nx">dygraph</span><span class="o">-</span><span class="nx">combined</span><span class="p">.</span><span class="nx">js</span> <span class="nx">is</span> <span class="nx">a</span> <span class="s2">&quot;packed&quot;</span> <span class="nx">version</span> <span class="nx">of</span> <span class="nx">the</span> <span class="nx">larger</span> <span class="nx">dygraphs</span> <span class="nx">JS</span> <span class="nx">files</span><span class="p">.</span> <span class="nx">It</span> <span class="nx">is</span></div><div class='line' id='LC5'><span class="nx">smaller</span> <span class="nx">and</span> <span class="nx">loads</span> <span class="nx">more</span> <span class="nx">quickly</span><span class="p">,</span> <span class="nx">but</span> <span class="nx">is</span> <span class="nx">harder</span> <span class="nx">to</span> <span class="nx">debug</span><span class="p">.</span></div><div class='line' id='LC6'><br/></div><div class='line' id='LC7'><span class="nx">To</span> <span class="nx">generate</span> <span class="k">this</span> <span class="nx">file</span><span class="p">,</span> <span class="nx">run</span> <span class="s2">&quot;make&quot;</span> <span class="nx">or</span> <span class="nx">generate</span><span class="o">-</span><span class="nx">combined</span><span class="p">.</span><span class="nx">sh</span><span class="p">.</span></div></pre></div>
          </td>
        </tr>
      </table>
  </div>

          </div>
        </div>

        <a href="#jump-to-line" rel="facebox" data-hotkey="l" class="js-jump-to-line" style="display:none">Jump to Line</a>
        <div id="jump-to-line" style="display:none">
          <h2>Jump to Line</h2>
          <form accept-charset="UTF-8" class="js-jump-to-line-form">
            <input class="textfield js-jump-to-line-field" type="text">
            <div class="full-button">
              <button type="submit" class="button">Go</button>
            </div>
          </form>
        </div>

      </div>
    </div>
</div>

<div id="js-frame-loading-template" class="frame frame-loading large-loading-area" style="display:none;">
  <img class="js-frame-loading-spinner" src="https://a248.e.akamai.net/assets.github.com/images/spinners/octocat-spinner-128.gif?1347543527" height="64" width="64">
</div>


        </div>
      </div>
      <div class="context-overlay"></div>
    </div>

      <div id="footer-push"></div><!-- hack for sticky footer -->
    </div><!-- end of wrapper - hack for sticky footer -->

      <!-- footer -->
      <div id="footer">
  <div class="container clearfix">

      <dl class="footer_nav">
        <dt>GitHub</dt>
        <dd><a href="https://github.com/about">About us</a></dd>
        <dd><a href="https://github.com/blog">Blog</a></dd>
        <dd><a href="https://github.com/contact">Contact &amp; support</a></dd>
        <dd><a href="http://enterprise.github.com/">GitHub Enterprise</a></dd>
        <dd><a href="http://status.github.com/">Site status</a></dd>
      </dl>

      <dl class="footer_nav">
        <dt>Applications</dt>
        <dd><a href="http://mac.github.com/">GitHub for Mac</a></dd>
        <dd><a href="http://windows.github.com/">GitHub for Windows</a></dd>
        <dd><a href="http://eclipse.github.com/">GitHub for Eclipse</a></dd>
        <dd><a href="http://mobile.github.com/">GitHub mobile apps</a></dd>
      </dl>

      <dl class="footer_nav">
        <dt>Services</dt>
        <dd><a href="http://get.gaug.es/">Gauges: Web analytics</a></dd>
        <dd><a href="http://speakerdeck.com">Speaker Deck: Presentations</a></dd>
        <dd><a href="https://gist.github.com">Gist: Code snippets</a></dd>
        <dd><a href="http://jobs.github.com/">Job board</a></dd>
      </dl>

      <dl class="footer_nav">
        <dt>Documentation</dt>
        <dd><a href="http://help.github.com/">GitHub Help</a></dd>
        <dd><a href="http://developer.github.com/">Developer API</a></dd>
        <dd><a href="http://github.github.com/github-flavored-markdown/">GitHub Flavored Markdown</a></dd>
        <dd><a href="http://pages.github.com/">GitHub Pages</a></dd>
      </dl>

      <dl class="footer_nav">
        <dt>More</dt>
        <dd><a href="http://training.github.com/">Training</a></dd>
        <dd><a href="https://github.com/edu">Students &amp; teachers</a></dd>
        <dd><a href="http://shop.github.com">The Shop</a></dd>
        <dd><a href="/plans">Plans &amp; pricing</a></dd>
        <dd><a href="http://octodex.github.com/">The Octodex</a></dd>
      </dl>

      <hr class="footer-divider">


    <p class="right">&copy; 2013 <span title="0.03533s from fe2.rs.github.com">GitHub</span>, Inc. All rights reserved.</p>
    <a class="left" href="https://github.com/">
      <span class="mega-icon mega-icon-invertocat"></span>
    </a>
    <ul id="legal">
        <li><a href="https://github.com/site/terms">Terms of Service</a></li>
        <li><a href="https://github.com/site/privacy">Privacy</a></li>
        <li><a href="https://github.com/security">Security</a></li>
    </ul>

  </div><!-- /.container -->

</div><!-- /.#footer -->


    <div class="fullscreen-overlay js-fullscreen-overlay" id="fullscreen_overlay">
  <div class="fullscreen-container js-fullscreen-container">
    <div class="textarea-wrap">
      <textarea name="fullscreen-contents" id="fullscreen-contents" class="js-fullscreen-contents" placeholder="" data-suggester="fullscreen_suggester"></textarea>
          <div class="suggester-container">
              <div class="suggester fullscreen-suggester js-navigation-container" id="fullscreen_suggester"
                 data-url="/danvk/dygraphs/suggestions/commit">
              </div>
          </div>
    </div>
  </div>
  <div class="fullscreen-sidebar">
    <a href="#" class="exit-fullscreen js-exit-fullscreen tooltipped leftwards" title="Exit Zen Mode">
      <span class="mega-icon mega-icon-normalscreen"></span>
    </a>
    <a href="#" class="theme-switcher js-theme-switcher tooltipped leftwards"
      title="Switch themes">
      <span class="mini-icon mini-icon-brightness"></span>
    </a>
  </div>
</div>



    <div id="ajax-error-message" class="flash flash-error">
      <span class="mini-icon mini-icon-exclamation"></span>
      Something went wrong with that request. Please try again.
      <a href="#" class="mini-icon mini-icon-remove-close ajax-error-dismiss"></a>
    </div>

    
    
    <span id='server_response_time' data-time='0.03579' data-host='fe2'></span>
    
  </body>
</html>

