.class public Lio/github/shumtugle/jot/Serve;
.super Landroid/webkit/WebViewClient;
.source "Serve.java"







.field private a:Lio/github/shumtugle/jot/MainActivity;



.method public constructor <init>(Lio/github/shumtugle/jot/MainActivity;)V
    .locals 0

    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V

    iput-object p1, p0, Lio/github/shumtugle/jot/Serve;->a:Lio/github/shumtugle/jot/MainActivity;

    return-void
.end method



.method public mime(Ljava/lang/String;)Ljava/lang/String;
    .locals 3

    const-string v0, ".js"

    invoke-virtual {p1, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v1

    if-eqz v1, :cond_css

    const-string v2, "application/javascript"

    return-object v2

    :cond_css
    const-string v0, ".css"

    invoke-virtual {p1, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v1

    if-eqz v1, :cond_png

    const-string v2, "text/css"

    return-object v2

    :cond_png
    const-string v0, ".png"

    invoke-virtual {p1, v0}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v1

    if-eqz v1, :cond_html

    const-string v2, "image/png"

    return-object v2

    :cond_html
    const-string v2, "text/html"

    return-object v2
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .locals 8

    const/4 v0, 0x0

    if-nez p2, :cond_go

    return-object v0

    :cond_go
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object v1

    if-nez v1, :cond_url

    return-object v0

    :cond_url
    invoke-virtual {v1}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v2

    const-string v3, "jot.local"

    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-nez v4, :cond_mine

    return-object v0

    :cond_mine
    invoke-virtual {v1}, Landroid/net/Uri;->getPath()Ljava/lang/String;

    move-result-object v2

    const-string v3, "/index.html"

    if-eqz v2, :cond_root

    invoke-virtual {v2}, Ljava/lang/String;->length()I

    move-result v4

    const/4 v5, 0x1

    if-gt v4, v5, :cond_have

    :cond_root
    move-object v2, v3

    :cond_have
    const-string v3, "/img/"

    invoke-virtual {v2, v3}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_notimg

    :try_start_1
    const/4 v4, 0x5

    invoke-virtual {v2, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v4

    invoke-static {v4}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v4

    iget-object v5, p0, Lio/github/shumtugle/jot/Serve;->a:Lio/github/shumtugle/jot/MainActivity;

    invoke-virtual {v5, v4}, Lio/github/shumtugle/jot/MainActivity;->openImg(I)Ljava/io/InputStream;

    move-result-object v6
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1

    if-nez v6, :cond_img2

    return-object v0

    :cond_img2
    new-instance v3, Landroid/webkit/WebResourceResponse;

    const-string v7, "image/*"

    invoke-direct {v3, v7, v0, v6}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V

    return-object v3

    :catch_1
    move-exception v4

    return-object v0

    :cond_notimg
    const-string v3, "/image"

    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_asset

    iget-object v5, p0, Lio/github/shumtugle/jot/Serve;->a:Lio/github/shumtugle/jot/MainActivity;

    invoke-virtual {v5}, Lio/github/shumtugle/jot/MainActivity;->openImage()Ljava/io/InputStream;

    move-result-object v6

    if-nez v6, :cond_img

    return-object v0

    :cond_img
    invoke-virtual {v5}, Lio/github/shumtugle/jot/MainActivity;->imageType()Ljava/lang/String;

    move-result-object v7

    new-instance v3, Landroid/webkit/WebResourceResponse;

    invoke-direct {v3, v7, v0, v6}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V

    return-object v3

    :cond_asset
    :try_start_0
    const/4 v4, 0x1

    invoke-virtual {v2, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v4

    iget-object v5, p0, Lio/github/shumtugle/jot/Serve;->a:Lio/github/shumtugle/jot/MainActivity;

    invoke-virtual {v5}, Lio/github/shumtugle/jot/MainActivity;->getAssets()Landroid/content/res/AssetManager;

    move-result-object v5

    invoke-virtual {v5, v4}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;

    move-result-object v6

    invoke-virtual {p0, v4}, Lio/github/shumtugle/jot/Serve;->mime(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v7

    new-instance v3, Landroid/webkit/WebResourceResponse;

    const-string v5, "utf-8"

    invoke-direct {v3, v7, v5, v6}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v3

    :catch_0
    move-exception v4

    return-object v0
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Z
    .locals 6

    const/4 v0, 0x0

    if-nez p2, :cond_go

    return v0

    :cond_go
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object v1

    if-nez v1, :cond_url

    return v0

    :cond_url
    invoke-virtual {v1}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v2

    const-string v3, "jot.local"

    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_out

    return v0

    :cond_out
    :try_start_0
    new-instance v4, Landroid/content/Intent;

    const-string v5, "android.intent.action.VIEW"

    invoke-direct {v4, v5, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V

    const/high16 v5, 0x10000000

    invoke-virtual {v4, v5}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    iget-object v5, p0, Lio/github/shumtugle/jot/Serve;->a:Lio/github/shumtugle/jot/MainActivity;

    invoke-virtual {v5, v4}, Lio/github/shumtugle/jot/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :cond_done

    :catch_0
    move-exception v4

    :cond_done
    const/4 v0, 0x1

    return v0
.end method
