.class public Lio/github/shumtugle/jot/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"



.field public buf:Ljava/io/ByteArrayOutputStream;

.field public eff:Ljava/lang/String;

.field public page:I

.field public cache:Ljava/io/File;

.field public imgs:Ljava/util/ArrayList;

.field public deep:I

.field public pend:[B

.field public pendMime:Ljava/lang/String;

.field public pendName:Ljava/lang/String;

.field public stashName:Ljava/lang/String;




.field public camUri:Landroid/net/Uri;

.field public src:Landroid/net/Uri;

.field public web:Landroid/webkit/WebView;



.method public constructor <init>()V
    .locals 0

    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    return-void
.end method



.method protected onCreate(Landroid/os/Bundle;)V
    .locals 6

    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    new-instance v2, Ljava/util/ArrayList;

    invoke-direct {v2}, Ljava/util/ArrayList;-><init>()V

    iput-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->imgs:Ljava/util/ArrayList;

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getIntent()Landroid/content/Intent;

    move-result-object v0

    invoke-virtual {p0, v0}, Lio/github/shumtugle/jot/MainActivity;->fromIntent(Landroid/content/Intent;)Landroid/net/Uri;

    move-result-object v0

    invoke-virtual {p0, v0}, Lio/github/shumtugle/jot/MainActivity;->setSource(Landroid/net/Uri;)V

    new-instance v1, Landroid/webkit/WebView;

    invoke-direct {v1, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V

    iput-object v1, p0, Lio/github/shumtugle/jot/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {v1}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;

    move-result-object v2

    const/4 v3, 0x1

    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V

    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V

    const/4 v4, 0x0

    invoke-virtual {v2, v4}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V

    
    
    
    
    
    
    
    
    
    
    const/4 v5, 0x2

    invoke-virtual {v2, v5}, Landroid/webkit/WebSettings;->setCacheMode(I)V

    const/high16 v5, -0x1000000

    invoke-virtual {v1, v5}, Landroid/webkit/WebView;->setBackgroundColor(I)V

    new-instance v5, Lio/github/shumtugle/jot/Serve;

    invoke-direct {v5, p0}, Lio/github/shumtugle/jot/Serve;-><init>(Lio/github/shumtugle/jot/MainActivity;)V

    invoke-virtual {v1, v5}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    const-string v5, "Jot"

    invoke-virtual {v1, p0, v5}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, "https://jot.local/"

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->pagePath()Ljava/lang/String;

    move-result-object v5

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v5

    invoke-virtual {v1, v5}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    invoke-virtual {p0, v1}, Lio/github/shumtugle/jot/MainActivity;->setContentView(Landroid/view/View;)V

    
    
    
    
    return-void
.end method

.method public fromIntent(Landroid/content/Intent;)Landroid/net/Uri;
    .locals 3

    const/4 v0, 0x0

    if-nez p1, :cond_go

    return-object v0

    :cond_go
    invoke-virtual {p1}, Landroid/content/Intent;->getAction()Ljava/lang/String;

    move-result-object v1

    const-string v2, "android.intent.action.SEND"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_data

    const-string v2, "android.intent.extra.STREAM"

    invoke-virtual {p1, v2}, Landroid/content/Intent;->getParcelableExtra(Ljava/lang/String;)Landroid/os/Parcelable;

    move-result-object v1

    instance-of v2, v1, Landroid/net/Uri;

    if-nez v2, :cond_cast

    return-object v0

    :cond_cast
    check-cast v1, Landroid/net/Uri;

    return-object v1

    :cond_data
    invoke-virtual {p1}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object v1

    return-object v1
.end method

.method public pickNow()V
    .locals 3

    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.intent.action.GET_CONTENT"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    const-string v1, "*/*"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    const-string v1, "android.intent.category.OPENABLE"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->addCategory(Ljava/lang/String;)Landroid/content/Intent;

    const/4 v2, 0x1

    :try_start_0
    invoke-virtual {p0, v0, v2}, Lio/github/shumtugle/jot/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    :catch_0
    move-exception v1

    return-void
.end method

.method public askNow()V
    .locals 4

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->pend:[B

    if-nez v0, :cond_go

    return-void

    :cond_go
    new-instance v1, Landroid/content/Intent;

    const-string v2, "android.intent.action.CREATE_DOCUMENT"

    invoke-direct {v1, v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    const-string v2, "android.intent.category.OPENABLE"

    invoke-virtual {v1, v2}, Landroid/content/Intent;->addCategory(Ljava/lang/String;)Landroid/content/Intent;

    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->pendMime:Ljava/lang/String;

    invoke-virtual {v1, v2}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    const-string v2, "android.intent.extra.TITLE"

    iget-object v3, p0, Lio/github/shumtugle/jot/MainActivity;->pendName:Ljava/lang/String;

    invoke-virtual {v1, v2, v3}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    const/4 v2, 0x2

    :try_start_0
    invoke-virtual {p0, v1, v2}, Lio/github/shumtugle/jot/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    :catch_0
    move-exception v3

    return-void
.end method

.method protected onActivityResult(IILandroid/content/Intent;)V
    .locals 8

    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onActivityResult(IILandroid/content/Intent;)V

    const/4 v0, -0x1

    if-ne p2, v0, :cond_camdrop

    
    
    
    const/4 v0, 0x4

    if-ne p1, v0, :cond_notcam

    iget-object v1, p0, Lio/github/shumtugle/jot/MainActivity;->camUri:Landroid/net/Uri;

    if-eqz v1, :cond_out

    
    
    
    
    
    
    
    
    
    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->imgs:Ljava/util/ArrayList;

    if-eqz v2, :cond_out

    invoke-virtual {v2, v1}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    invoke-virtual {v2}, Ljava/util/ArrayList;->size()I

    move-result v3

    add-int/lit8 v3, v3, -0x1

    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, "javascript:jotShot("

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v5, ")"

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v5

    iget-object v6, p0, Lio/github/shumtugle/jot/MainActivity;->web:Landroid/webkit/WebView;

    if-eqz v6, :cond_out

    invoke-virtual {v6, v5}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void

    :cond_camdrop
    
    
    const/4 v7, 0x0

    iput-object v7, p0, Lio/github/shumtugle/jot/MainActivity;->camUri:Landroid/net/Uri;

    return-void

    :cond_notcam

    if-eqz p3, :cond_out

    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object v1

    if-eqz v1, :cond_out

    const/4 v0, 0x3

    if-ne p1, v0, :cond_two

    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->imgs:Ljava/util/ArrayList;

    if-eqz v2, :cond_out

    invoke-virtual {v2, v1}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    invoke-virtual {v2}, Ljava/util/ArrayList;->size()I

    move-result v3

    add-int/lit8 v3, v3, -0x1

    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, "javascript:jotImg("

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v5, ")"

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v5

    iget-object v6, p0, Lio/github/shumtugle/jot/MainActivity;->web:Landroid/webkit/WebView;

    if-eqz v6, :cond_out

    invoke-virtual {v6, v5}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void

    :cond_two
    const/4 v0, 0x2

    if-ne p1, v0, :cond_pick

    
    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->pend:[B

    const/4 v3, 0x0

    iput-object v3, p0, Lio/github/shumtugle/jot/MainActivity;->pend:[B

    if-eqz v2, :cond_out

    invoke-virtual {p0, v1, v2}, Lio/github/shumtugle/jot/MainActivity;->writeTo(Landroid/net/Uri;[B)Z

    move-result v4

    if-eqz v4, :cond_bad

    const/4 v5, 0x0

    const-string v6, "\u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e"

    invoke-virtual {p0, v5, v6, v3}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void

    :cond_bad
    const/4 v5, 0x0

    const-string v6, "\u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c"

    invoke-virtual {p0, v5, v6, v3}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void

    :cond_pick
    invoke-virtual {p0, v1}, Lio/github/shumtugle/jot/MainActivity;->setSource(Landroid/net/Uri;)V

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->reload()V

    :cond_out
    return-void
.end method

.method public reload()V
    .locals 4

    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "https://jot.local/"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->pagePath()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, "?t="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v2

    invoke-virtual {v0, v2, v3}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->web:Landroid/webkit/WebView;

    if-eqz v0, :cond_out

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    :cond_out
    return-void
.end method

.method protected onNewIntent(Landroid/content/Intent;)V
    .locals 2

    invoke-super {p0, p1}, Landroid/app/Activity;->onNewIntent(Landroid/content/Intent;)V

    invoke-virtual {p0, p1}, Lio/github/shumtugle/jot/MainActivity;->setIntent(Landroid/content/Intent;)V

    invoke-virtual {p0, p1}, Lio/github/shumtugle/jot/MainActivity;->fromIntent(Landroid/content/Intent;)Landroid/net/Uri;

    move-result-object v0

    if-eqz v0, :cond_out

    invoke-virtual {p0, v0}, Lio/github/shumtugle/jot/MainActivity;->setSource(Landroid/net/Uri;)V

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->reload()V

    :cond_out
    return-void
.end method

.method public onBackPressed()V
    .locals 3

    
    
    iget v0, p0, Lio/github/shumtugle/jot/MainActivity;->deep:I

    if-lez v0, :cond_bg

    iget-object v1, p0, Lio/github/shumtugle/jot/MainActivity;->web:Landroid/webkit/WebView;

    if-eqz v1, :cond_bg

    const-string v2, "javascript:jotBack()"

    invoke-virtual {v1, v2}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    return-void

    :cond_bg
    const/4 v0, 0x1

    invoke-virtual {p0, v0}, Lio/github/shumtugle/jot/MainActivity;->moveTaskToBack(Z)Z

    return-void
.end method

.method public openImage()Ljava/io/InputStream;
    .locals 8

    iget-object v1, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    if-eqz v1, :cond_uri

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->openPdf()Ljava/io/InputStream;

    move-result-object v1

    return-object v1

    :cond_uri
    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->src:Landroid/net/Uri;

    if-nez v0, :cond_go

    const/4 v1, 0x0

    return-object v1

    :cond_go
    :try_start_0
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v1

    invoke-virtual {v1, v0}, Landroid/content/ContentResolver;->getType(Landroid/net/Uri;)Ljava/lang/String;

    move-result-object v2

    if-nez v2, :cond_type

    const-string v2, "image/jpeg"

    :cond_type
    iput-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->eff:Ljava/lang/String;

    
    const-string v3, "pdf"

    invoke-virtual {v2, v3}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v4

    if-eqz v4, :cond_heic

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->openPdf()Ljava/io/InputStream;

    move-result-object v5

    return-object v5

    
    :cond_heic
    const-string v3, "heic"

    invoke-virtual {v2, v3}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v4

    if-nez v4, :cond_trans

    const-string v3, "heif"

    invoke-virtual {v2, v3}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v4

    if-nez v4, :cond_trans

    invoke-virtual {v1, v0}, Landroid/content/ContentResolver;->openInputStream(Landroid/net/Uri;)Ljava/io/InputStream;

    move-result-object v5

    return-object v5

    :cond_trans
    invoke-virtual {v1, v0}, Landroid/content/ContentResolver;->openInputStream(Landroid/net/Uri;)Ljava/io/InputStream;

    move-result-object v5

    invoke-static {v5}, Landroid/graphics/BitmapFactory;->decodeStream(Ljava/io/InputStream;)Landroid/graphics/Bitmap;

    move-result-object v6

    invoke-virtual {v5}, Ljava/io/InputStream;->close()V

    if-nez v6, :cond_enc

    const/4 v7, 0x0

    return-object v7

    :cond_enc
    new-instance v7, Ljava/io/ByteArrayOutputStream;

    invoke-direct {v7}, Ljava/io/ByteArrayOutputStream;-><init>()V

    sget-object v3, Landroid/graphics/Bitmap$CompressFormat;->JPEG:Landroid/graphics/Bitmap$CompressFormat;

    const/16 v4, 0x5f

    invoke-virtual {v6, v3, v4, v7}, Landroid/graphics/Bitmap;->compress(Landroid/graphics/Bitmap$CompressFormat;ILjava/io/OutputStream;)Z

    invoke-virtual {v6}, Landroid/graphics/Bitmap;->recycle()V

    const-string v2, "image/jpeg"

    iput-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->eff:Ljava/lang/String;

    new-instance v3, Ljava/io/ByteArrayInputStream;

    invoke-virtual {v7}, Ljava/io/ByteArrayOutputStream;->toByteArray()[B

    move-result-object v4

    invoke-direct {v3, v4}, Ljava/io/ByteArrayInputStream;-><init>([B)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v3

    :catch_0
    move-exception v1

    const/4 v2, 0x0

    return-object v2
.end method

.method public openPdf()Ljava/io/InputStream;
    .locals 14

    :try_start_0
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->fd()Landroid/os/ParcelFileDescriptor;

    move-result-object v3

    if-nez v3, :cond_go

    const/4 v0, 0x0

    return-object v0

    :cond_go
    new-instance v4, Landroid/graphics/pdf/PdfRenderer;

    invoke-direct {v4, v3}, Landroid/graphics/pdf/PdfRenderer;-><init>(Landroid/os/ParcelFileDescriptor;)V

    invoke-virtual {v4}, Landroid/graphics/pdf/PdfRenderer;->getPageCount()I

    move-result v5

    if-gtz v5, :cond_pages

    invoke-virtual {v4}, Landroid/graphics/pdf/PdfRenderer;->close()V

    const/4 v0, 0x0

    return-object v0

    :cond_pages
    iget v6, p0, Lio/github/shumtugle/jot/MainActivity;->page:I

    if-gez v6, :cond_low

    const/4 v6, 0x0

    :cond_low
    if-lt v6, v5, :cond_high

    add-int/lit8 v6, v5, -0x1

    :cond_high
    invoke-virtual {v4, v6}, Landroid/graphics/pdf/PdfRenderer;->openPage(I)Landroid/graphics/pdf/PdfRenderer$Page;

    move-result-object v7

    invoke-virtual {v7}, Landroid/graphics/pdf/PdfRenderer$Page;->getWidth()I

    move-result v8

    invoke-virtual {v7}, Landroid/graphics/pdf/PdfRenderer$Page;->getHeight()I

    move-result v9

    
    move v10, v8

    if-le v9, v8, :cond_max

    move v10, v9

    :cond_max
    if-gtz v10, :cond_ok

    const/4 v10, 0x1

    :cond_ok
    const/16 v11, 0x898

    mul-int/2addr v8, v11

    div-int/2addr v8, v10

    mul-int/2addr v9, v11

    div-int/2addr v9, v10

    if-gtz v8, :cond_w

    const/4 v8, 0x1

    :cond_w
    if-gtz v9, :cond_h

    const/4 v9, 0x1

    :cond_h
    sget-object v12, Landroid/graphics/Bitmap$Config;->ARGB_8888:Landroid/graphics/Bitmap$Config;

    invoke-static {v8, v9, v12}, Landroid/graphics/Bitmap;->createBitmap(IILandroid/graphics/Bitmap$Config;)Landroid/graphics/Bitmap;

    move-result-object v13

    const/4 v11, -0x1

    invoke-virtual {v13, v11}, Landroid/graphics/Bitmap;->eraseColor(I)V

    const/4 v11, 0x0

    const/4 v12, 0x1

    invoke-virtual {v7, v13, v11, v11, v12}, Landroid/graphics/pdf/PdfRenderer$Page;->render(Landroid/graphics/Bitmap;Landroid/graphics/Rect;Landroid/graphics/Matrix;I)V

    invoke-virtual {v7}, Landroid/graphics/pdf/PdfRenderer$Page;->close()V

    invoke-virtual {v4}, Landroid/graphics/pdf/PdfRenderer;->close()V

    invoke-virtual {v3}, Landroid/os/ParcelFileDescriptor;->close()V

    new-instance v0, Ljava/io/ByteArrayOutputStream;

    invoke-direct {v0}, Ljava/io/ByteArrayOutputStream;-><init>()V

    sget-object v1, Landroid/graphics/Bitmap$CompressFormat;->PNG:Landroid/graphics/Bitmap$CompressFormat;

    const/16 v2, 0x64

    invoke-virtual {v13, v1, v2, v0}, Landroid/graphics/Bitmap;->compress(Landroid/graphics/Bitmap$CompressFormat;ILjava/io/OutputStream;)Z

    invoke-virtual {v13}, Landroid/graphics/Bitmap;->recycle()V

    const-string v1, "image/png"

    iput-object v1, p0, Lio/github/shumtugle/jot/MainActivity;->eff:Ljava/lang/String;

    new-instance v1, Ljava/io/ByteArrayInputStream;

    invoke-virtual {v0}, Ljava/io/ByteArrayOutputStream;->toByteArray()[B

    move-result-object v2

    invoke-direct {v1, v2}, Ljava/io/ByteArrayInputStream;-><init>([B)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v1

    :catch_0
    move-exception v0

    const/4 v1, 0x0

    return-object v1
.end method

.method public imageType()Ljava/lang/String;
    .locals 1

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->eff:Ljava/lang/String;

    if-nez v0, :cond_ok

    const-string v0, "image/jpeg"

    :cond_ok
    return-object v0
.end method

.method public post(ILjava/lang/String;Landroid/net/Uri;)V
    .locals 1

    new-instance v0, Lio/github/shumtugle/jot/Post;

    invoke-direct {v0, p0, p1, p2, p3}, Lio/github/shumtugle/jot/Post;-><init>(Lio/github/shumtugle/jot/MainActivity;ILjava/lang/String;Landroid/net/Uri;)V

    invoke-virtual {p0, v0}, Lio/github/shumtugle/jot/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    return-void
.end method

.method public writeTo(Landroid/net/Uri;[B)Z
    .locals 3

    :try_start_0
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v0

    invoke-virtual {v0, p1}, Landroid/content/ContentResolver;->openOutputStream(Landroid/net/Uri;)Ljava/io/OutputStream;

    move-result-object v1

    if-nez v1, :cond_go

    const/4 v2, 0x0

    return v2

    :cond_go
    invoke-virtual {v1, p2}, Ljava/io/OutputStream;->write([B)V

    invoke-virtual {v1}, Ljava/io/OutputStream;->flush()V

    invoke-virtual {v1}, Ljava/io/OutputStream;->close()V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    const/4 v2, 0x1

    return v2

    :catch_0
    move-exception v0

    const/4 v2, 0x0

    return v2
.end method

.method public store([BLjava/lang/String;Ljava/lang/String;)Landroid/net/Uri;
    .locals 7

    :try_start_0
    new-instance v0, Landroid/content/ContentValues;

    invoke-direct {v0}, Landroid/content/ContentValues;-><init>()V

    const-string v1, "_display_name"

    invoke-virtual {v0, v1, p2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    const-string v1, "mime_type"

    invoke-virtual {v0, v1, p3}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    const-string v1, "application/pdf"

    invoke-virtual {v1, p3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_img

    const-string v3, "relative_path"

    const-string v4, "Download/Jot"

    invoke-virtual {v0, v3, v4}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    sget-object v5, Landroid/provider/MediaStore$Downloads;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    goto :cond_base

    :cond_img
    const-string v3, "relative_path"

    const-string v4, "Pictures/Jot"

    invoke-virtual {v0, v3, v4}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    sget-object v5, Landroid/provider/MediaStore$Images$Media;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    :cond_base
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v6

    invoke-virtual {v6, v5, v0}, Landroid/content/ContentResolver;->insert(Landroid/net/Uri;Landroid/content/ContentValues;)Landroid/net/Uri;

    move-result-object v6
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    if-nez v6, :cond_write

    const/4 v1, 0x0

    return-object v1

    :cond_write
    invoke-virtual {p0, v6, p1}, Lio/github/shumtugle/jot/MainActivity;->writeTo(Landroid/net/Uri;[B)Z

    move-result v2

    if-nez v2, :cond_ok

    const/4 v1, 0x0

    return-object v1

    :cond_ok
    return-object v6

    :catch_0
    move-exception v1

    const/4 v2, 0x0

    return-object v2
.end method

.method public mimeOf(Ljava/lang/String;)Ljava/lang/String;
    .locals 3

    const-string v0, "png"

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_pdf

    const-string v2, "image/png"

    return-object v2

    :cond_pdf
    const-string v0, "pdf"

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_jpg

    const-string v2, "application/pdf"

    return-object v2

    :cond_jpg
    const-string v2, "image/jpeg"

    return-object v2
.end method






.method public has()Z
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 2

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    if-eqz v0, :cond_ask2

    const/4 v1, 0x1

    return v1

    :cond_ask2
    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->src:Landroid/net/Uri;

    if-nez v0, :cond_yes

    const/4 v1, 0x0

    return v1

    :cond_yes
    const/4 v1, 0x1

    return v1
.end method

.method public pages()I
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 6

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->src:Landroid/net/Uri;

    const/4 v1, 0x0

    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    if-eqz v2, :cond_need

    goto :cond_go

    :cond_need
    if-nez v0, :cond_go

    return v1

    :cond_go
    :try_start_0
    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    if-eqz v2, :cond_ask

    goto :cond_pdf

    :cond_ask
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v2

    invoke-virtual {v2, v0}, Landroid/content/ContentResolver;->getType(Landroid/net/Uri;)Ljava/lang/String;

    move-result-object v3

    if-nez v3, :cond_type

    return v1

    :cond_type
    const-string v4, "pdf"

    invoke-virtual {v3, v4}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v5

    if-nez v5, :cond_pdf

    return v1

    :cond_pdf
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->fd()Landroid/os/ParcelFileDescriptor;

    move-result-object v5

    if-nez v5, :cond_fd

    return v1

    :cond_fd
    new-instance v2, Landroid/graphics/pdf/PdfRenderer;

    invoke-direct {v2, v5}, Landroid/graphics/pdf/PdfRenderer;-><init>(Landroid/os/ParcelFileDescriptor;)V

    invoke-virtual {v2}, Landroid/graphics/pdf/PdfRenderer;->getPageCount()I

    move-result v3

    invoke-virtual {v2}, Landroid/graphics/pdf/PdfRenderer;->close()V

    invoke-virtual {v5}, Landroid/os/ParcelFileDescriptor;->close()V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return v3

    :catch_0
    move-exception v2

    return v1
.end method

.method public page(I)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 0

    iput p1, p0, Lio/github/shumtugle/jot/MainActivity;->page:I

    return-void
.end method

.method public pick()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 3

    const/4 v0, 0x1

    const/4 v1, 0x0

    invoke-virtual {p0, v0, v1, v1}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void
.end method

.method public toast(Ljava/lang/String;)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 2

    const/4 v0, 0x0

    invoke-virtual {p0, v0, p1, v0}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void
.end method

.method public begin()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 1

    new-instance v0, Ljava/io/ByteArrayOutputStream;

    invoke-direct {v0}, Ljava/io/ByteArrayOutputStream;-><init>()V

    iput-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->buf:Ljava/io/ByteArrayOutputStream;

    return-void
.end method

.method public chunk(Ljava/lang/String;)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 4

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->buf:Ljava/io/ByteArrayOutputStream;

    if-eqz v0, :cond_out

    if-eqz p1, :cond_out

    :try_start_0
    const/4 v1, 0x0

    invoke-static {p1, v1}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B

    move-result-object v2

    array-length v3, v2

    invoke-virtual {v0, v2, v1, v3}, Ljava/io/ByteArrayOutputStream;->write([BII)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :cond_out

    :catch_0
    move-exception v1

    :cond_out
    return-void
.end method

.method public end(Ljava/lang/String;Ljava/lang/String;I)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 9

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->buf:Ljava/io/ByteArrayOutputStream;

    const/4 v1, 0x0

    iput-object v1, p0, Lio/github/shumtugle/jot/MainActivity;->buf:Ljava/io/ByteArrayOutputStream;

    if-nez v0, :cond_go

    return-void

    :cond_go
    invoke-virtual {v0}, Ljava/io/ByteArrayOutputStream;->toByteArray()[B

    move-result-object v2

    invoke-virtual {p0, p1}, Lio/github/shumtugle/jot/MainActivity;->mimeOf(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v4, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v5, "."

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    const/4 v5, 0x2

    if-ne p3, v5, :cond_store

    
    iput-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->pend:[B

    iput-object v4, p0, Lio/github/shumtugle/jot/MainActivity;->pendName:Ljava/lang/String;

    iput-object v3, p0, Lio/github/shumtugle/jot/MainActivity;->pendMime:Ljava/lang/String;

    const/4 v6, 0x3

    invoke-virtual {p0, v6, v1, v1}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void

    :cond_store
    invoke-virtual {p0, v2, v4, v3}, Lio/github/shumtugle/jot/MainActivity;->store([BLjava/lang/String;Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v6

    if-nez v6, :cond_ok

    const/4 v7, 0x0

    const-string v8, "\u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c"

    invoke-virtual {p0, v7, v8, v1}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void

    :cond_ok
    const/4 v7, 0x1

    if-ne p3, v7, :cond_done

    invoke-virtual {p0, v5, v3, v6}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    :cond_done
    return-void
.end method

.method public pagePath()Ljava/lang/String;
    .locals 6

    const-string v0, "index.html"

    const-string v1, "velho.html"

    
    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    if-eqz v2, :cond_src

    return-object v0

    :cond_src
    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->src:Landroid/net/Uri;

    if-nez v2, :cond_go

    return-object v0

    :cond_go
    :try_start_0
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v3

    invoke-virtual {v3, v2}, Landroid/content/ContentResolver;->getType(Landroid/net/Uri;)Ljava/lang/String;

    move-result-object v3

    if-eqz v3, :cond_uri

    const-string v4, "tif"

    invoke-virtual {v3, v4}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v5

    if-eqz v5, :cond_uri

    return-object v1

    
    :cond_uri
    invoke-virtual {v2}, Landroid/net/Uri;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/String;->toLowerCase()Ljava/lang/String;

    move-result-object v3

    const-string v4, ".tif"

    invoke-virtual {v3, v4}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v5

    if-eqz v5, :cond_out

    return-object v1
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :cond_out
    return-object v0

    :catch_0
    move-exception v2

    return-object v0
.end method

.method public srcName()Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 10

    const-string v0, ""

    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    if-eqz v2, :cond_uri2

    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->stashName:Ljava/lang/String;

    if-eqz v2, :cond_uri2

    return-object v2

    :cond_uri2
    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->src:Landroid/net/Uri;

    if-nez v2, :cond_go

    return-object v0

    :cond_go
    :try_start_0
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v1

    
    const/4 v3, 0x0

    const/4 v4, 0x0

    const/4 v5, 0x0

    const/4 v6, 0x0

    invoke-virtual/range {v1 .. v6}, Landroid/content/ContentResolver;->query(Landroid/net/Uri;[Ljava/lang/String;Ljava/lang/String;[Ljava/lang/String;Ljava/lang/String;)Landroid/database/Cursor;

    move-result-object v7

    if-eqz v7, :cond_last

    const-string v8, "_display_name"

    invoke-interface {v7, v8}, Landroid/database/Cursor;->getColumnIndex(Ljava/lang/String;)I

    move-result v9

    if-ltz v9, :cond_close

    invoke-interface {v7}, Landroid/database/Cursor;->moveToFirst()Z

    move-result v8

    if-eqz v8, :cond_close

    invoke-interface {v7, v9}, Landroid/database/Cursor;->getString(I)Ljava/lang/String;

    move-result-object v8

    invoke-interface {v7}, Landroid/database/Cursor;->close()V

    if-eqz v8, :cond_last

    return-object v8

    :cond_close
    invoke-interface {v7}, Landroid/database/Cursor;->close()V

    :cond_last
    invoke-virtual {v2}, Landroid/net/Uri;->getLastPathSegment()Ljava/lang/String;

    move-result-object v9
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    if-nez v9, :cond_ok

    return-object v0

    :cond_ok
    return-object v9

    :catch_0
    move-exception v1

    return-object v0
.end method

.method public fd()Landroid/os/ParcelFileDescriptor;
    .locals 4

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    if-eqz v0, :cond_uri

    const/high16 v1, 0x10000000

    invoke-static {v0, v1}, Landroid/os/ParcelFileDescriptor;->open(Ljava/io/File;I)Landroid/os/ParcelFileDescriptor;

    move-result-object v2

    return-object v2

    :cond_uri
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v1

    iget-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->src:Landroid/net/Uri;

    const-string v3, "r"

    invoke-virtual {v1, v2, v3}, Landroid/content/ContentResolver;->openFileDescriptor(Landroid/net/Uri;Ljava/lang/String;)Landroid/os/ParcelFileDescriptor;

    move-result-object v0

    return-object v0
.end method

.method public stash(Ljava/lang/String;)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 6

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->buf:Ljava/io/ByteArrayOutputStream;

    const/4 v1, 0x0

    iput-object v1, p0, Lio/github/shumtugle/jot/MainActivity;->buf:Ljava/io/ByteArrayOutputStream;

    if-nez v0, :cond_go

    return-void

    :cond_go
    :try_start_0
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getCacheDir()Ljava/io/File;

    move-result-object v2

    new-instance v3, Ljava/io/File;

    const-string v4, "jot-handoff.pdf"

    invoke-direct {v3, v2, v4}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    new-instance v4, Ljava/io/FileOutputStream;

    invoke-direct {v4, v3}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V

    invoke-virtual {v0}, Ljava/io/ByteArrayOutputStream;->toByteArray()[B

    move-result-object v5

    invoke-virtual {v4, v5}, Ljava/io/FileOutputStream;->write([B)V

    invoke-virtual {v4}, Ljava/io/FileOutputStream;->flush()V

    invoke-virtual {v4}, Ljava/io/FileOutputStream;->close()V

    iput-object v3, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    iput-object p1, p0, Lio/github/shumtugle/jot/MainActivity;->stashName:Ljava/lang/String;

    const/4 v5, 0x0

    iput v5, p0, Lio/github/shumtugle/jot/MainActivity;->page:I

    const-string v5, "image/png"

    iput-object v5, p0, Lio/github/shumtugle/jot/MainActivity;->eff:Ljava/lang/String;

    const/4 v5, 0x4

    invoke-virtual {p0, v5, v1, v1}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    :catch_0
    move-exception v2

    const/4 v3, 0x0

    const-string v4, "\u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0435\u0440\u0435\u0434\u0430\u0442\u044c"

    invoke-virtual {p0, v3, v4, v1}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void
.end method

.method public setSource(Landroid/net/Uri;)V
    .locals 2

    
    
    iput-object p1, p0, Lio/github/shumtugle/jot/MainActivity;->src:Landroid/net/Uri;

    const/4 v0, 0x0

    iput-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->cache:Ljava/io/File;

    iput-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->eff:Ljava/lang/String;

    iput-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->stashName:Ljava/lang/String;

    const/4 v1, 0x0

    iput v1, p0, Lio/github/shumtugle/jot/MainActivity;->page:I

    return-void
.end method

.method public depth(I)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 0

    iput p1, p0, Lio/github/shumtugle/jot/MainActivity;->deep:I

    return-void
.end method

.method public source()Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 4

    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->srcName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, " \u00b7 "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->imageType()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    return-object v2
.end method

.method public pickImg()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 3

    const/4 v0, 0x5

    const/4 v1, 0x0

    invoke-virtual {p0, v0, v1, v1}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void
.end method




































.method public keepShot()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 8

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->camUri:Landroid/net/Uri;

    if-eqz v0, :cond_none

    :try_start_0
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v1

    invoke-virtual {v1, v0}, Landroid/content/ContentResolver;->openInputStream(Landroid/net/Uri;)Ljava/io/InputStream;

    move-result-object v2

    if-eqz v2, :cond_none

    new-instance v3, Ljava/io/ByteArrayOutputStream;

    invoke-direct {v3}, Ljava/io/ByteArrayOutputStream;-><init>()V

    const/16 v4, 0x2000

    new-array v4, v4, [B

    :goto_read
    invoke-virtual {v2, v4}, Ljava/io/InputStream;->read([B)I

    move-result v5

    if-lez v5, :cond_done

    const/4 v6, 0x0

    invoke-virtual {v3, v4, v6, v5}, Ljava/io/ByteArrayOutputStream;->write([BII)V

    goto :goto_read

    :cond_done
    invoke-virtual {v2}, Ljava/io/InputStream;->close()V

    invoke-virtual {v3}, Ljava/io/ByteArrayOutputStream;->toByteArray()[B

    move-result-object v6

    array-length v7, v6

    if-lez v7, :cond_none

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->shotName()Ljava/lang/String;

    move-result-object v7

    const-string v1, "image/jpeg"

    invoke-virtual {p0, v6, v7, v1}, Lio/github/shumtugle/jot/MainActivity;->store([BLjava/lang/String;Ljava/lang/String;)Landroid/net/Uri;
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :cond_none
    return-void

    :catch_0
    move-exception v1

    return-void
.end method




.method public shotName()Ljava/lang/String;
    .locals 4

    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "jot-cam-"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v2

    invoke-virtual {v0, v2, v3}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v1, ".jpg"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    return-object v1
.end method













.method public useShot()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 3

    const/4 v0, 0x7

    const/4 v1, 0x0

    invoke-virtual {p0, v0, v1, v1}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void
.end method






.method public useShotNow()V
    .locals 2

    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->camUri:Landroid/net/Uri;

    const/4 v1, 0x0

    iput-object v1, p0, Lio/github/shumtugle/jot/MainActivity;->camUri:Landroid/net/Uri;

    if-eqz v0, :cond_none

    invoke-virtual {p0, v0}, Lio/github/shumtugle/jot/MainActivity;->setSource(Landroid/net/Uri;)V

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->reload()V

    :cond_none
    return-void
.end method

.method public camNow()V
    .locals 9

    new-instance v0, Landroid/content/ContentValues;

    invoke-direct {v0}, Landroid/content/ContentValues;-><init>()V

    const-string v1, "_display_name"

    
    
    
    
    
    
    
    
    
    
    new-instance v6, Ljava/lang/StringBuilder;

    invoke-direct {v6}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "jot-"

    invoke-virtual {v6, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v7

    invoke-virtual {v6, v7, v8}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v2, ".jpg"

    invoke-virtual {v6, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v6}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v0, v1, v2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    const-string v1, "mime_type"

    const-string v2, "image/jpeg"

    invoke-virtual {v0, v1, v2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    :try_start_0
    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v3

    sget-object v4, Landroid/provider/MediaStore$Images$Media;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    invoke-virtual {v3, v4, v0}, Landroid/content/ContentResolver;->insert(Landroid/net/Uri;Landroid/content/ContentValues;)Landroid/net/Uri;

    move-result-object v5

    if-eqz v5, :cond_no

    iput-object v5, p0, Lio/github/shumtugle/jot/MainActivity;->camUri:Landroid/net/Uri;

    new-instance v1, Landroid/content/Intent;

    const-string v2, "android.media.action.IMAGE_CAPTURE"

    invoke-direct {v1, v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    const-string v2, "output"

    invoke-virtual {v1, v2, v5}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Landroid/os/Parcelable;)Landroid/content/Intent;

    
    
    
    
    
    
    
    
    
    const/4 v2, 0x3

    invoke-virtual {v1, v2}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    const/4 v2, 0x4

    invoke-virtual {p0, v1, v2}, Lio/github/shumtugle/jot/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V

    return-void

    :cond_no
    return-void
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    move-exception v1

    
    
    
    
    
    
    const/4 v2, 0x0

    iput-object v2, p0, Lio/github/shumtugle/jot/MainActivity;->camUri:Landroid/net/Uri;

    invoke-virtual {v1}, Ljava/lang/Exception;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-virtual {p0, v3}, Lio/github/shumtugle/jot/MainActivity;->toast(Ljava/lang/String;)V

    return-void
.end method

.method public cam()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .locals 3

    
    
    
    const/4 v0, 0x6

    const/4 v1, 0x0

    invoke-virtual {p0, v0, v1, v1}, Lio/github/shumtugle/jot/MainActivity;->post(ILjava/lang/String;Landroid/net/Uri;)V

    return-void
.end method

.method public pickImgNow()V
    .locals 3

    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.intent.action.GET_CONTENT"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    const-string v1, "image/*"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    const-string v1, "android.intent.category.OPENABLE"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->addCategory(Ljava/lang/String;)Landroid/content/Intent;

    const/4 v2, 0x3

    :try_start_0
    invoke-virtual {p0, v0, v2}, Lio/github/shumtugle/jot/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    :catch_0
    move-exception v1

    return-void
.end method

.method public openImg(I)Ljava/io/InputStream;
    .locals 4

    :try_start_0
    iget-object v0, p0, Lio/github/shumtugle/jot/MainActivity;->imgs:Ljava/util/ArrayList;

    if-nez v0, :cond_go

    const/4 v1, 0x0

    return-object v1

    :cond_go
    invoke-virtual {v0}, Ljava/util/ArrayList;->size()I

    move-result v1

    if-ltz p1, :cond_bad

    if-lt p1, v1, :cond_ok

    :cond_bad
    const/4 v2, 0x0

    return-object v2

    :cond_ok
    invoke-virtual {v0, p1}, Ljava/util/ArrayList;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Landroid/net/Uri;

    invoke-virtual {p0}, Lio/github/shumtugle/jot/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v3

    invoke-virtual {v3, v2}, Landroid/content/ContentResolver;->openInputStream(Landroid/net/Uri;)Ljava/io/InputStream;

    move-result-object v3
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v3

    :catch_0
    move-exception v0

    const/4 v1, 0x0

    return-object v1
.end method
