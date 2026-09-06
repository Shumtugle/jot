.class public Lio/github/shumtugle/jot/Post;
.super Ljava/lang/Object;
.source "Post.java"

.implements Ljava/lang/Runnable;







.field private a:Lio/github/shumtugle/jot/MainActivity;

.field private op:I

.field private s:Ljava/lang/String;

.field private u:Landroid/net/Uri;



.method public constructor <init>(Lio/github/shumtugle/jot/MainActivity;ILjava/lang/String;Landroid/net/Uri;)V
    .locals 0

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Lio/github/shumtugle/jot/Post;->a:Lio/github/shumtugle/jot/MainActivity;

    iput p2, p0, Lio/github/shumtugle/jot/Post;->op:I

    iput-object p3, p0, Lio/github/shumtugle/jot/Post;->s:Ljava/lang/String;

    iput-object p4, p0, Lio/github/shumtugle/jot/Post;->u:Landroid/net/Uri;

    return-void
.end method



.method public run()V
    .locals 6

    iget-object v0, p0, Lio/github/shumtugle/jot/Post;->a:Lio/github/shumtugle/jot/MainActivity;

    if-nez v0, :cond_go

    return-void

    :cond_go
    iget v1, p0, Lio/github/shumtugle/jot/Post;->op:I

    if-nez v1, :cond_pick

    iget-object v2, p0, Lio/github/shumtugle/jot/Post;->s:Ljava/lang/String;

    if-nez v2, :cond_toast

    return-void

    :cond_toast
    const/4 v3, 0x1

    invoke-static {v0, v2, v3}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v4

    invoke-virtual {v4}, Landroid/widget/Toast;->show()V

    return-void

    :cond_pick
    const/4 v3, 0x1

    if-ne v1, v3, :cond_ask

    invoke-virtual {v0}, Lio/github/shumtugle/jot/MainActivity;->pickNow()V

    return-void

    :cond_ask
    const/4 v3, 0x5

    if-ne v1, v3, :cond_use

    invoke-virtual {v0}, Lio/github/shumtugle/jot/MainActivity;->pickImgNow()V

    return-void

    :cond_use
    const/4 v3, 0x7

    if-ne v1, v3, :cond_cam

    
    
    invoke-virtual {v0}, Lio/github/shumtugle/jot/MainActivity;->useShotNow()V

    return-void

    :cond_cam
    const/4 v3, 0x6

    if-ne v1, v3, :cond_ask5

    
    
    invoke-virtual {v0}, Lio/github/shumtugle/jot/MainActivity;->camNow()V

    return-void

    :cond_ask5
    const/4 v3, 0x4

    if-ne v1, v3, :cond_ask3

    invoke-virtual {v0}, Lio/github/shumtugle/jot/MainActivity;->reload()V

    return-void

    :cond_ask3
    const/4 v3, 0x3

    if-ne v1, v3, :cond_share

    invoke-virtual {v0}, Lio/github/shumtugle/jot/MainActivity;->askNow()V

    return-void

    :cond_share
    iget-object v2, p0, Lio/github/shumtugle/jot/Post;->u:Landroid/net/Uri;

    if-nez v2, :cond_send

    return-void

    :cond_send
    :try_start_0
    new-instance v3, Landroid/content/Intent;

    const-string v4, "android.intent.action.SEND"

    invoke-direct {v3, v4}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    iget-object v4, p0, Lio/github/shumtugle/jot/Post;->s:Ljava/lang/String;

    if-nez v4, :cond_type

    const-string v4, "image/*"

    :cond_type
    invoke-virtual {v3, v4}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    const-string v4, "android.intent.extra.STREAM"

    invoke-virtual {v3, v4, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Landroid/os/Parcelable;)Landroid/content/Intent;

    const/4 v4, 0x1

    invoke-virtual {v3, v4}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    const-string v4, "Jot"

    invoke-static {v3, v4}, Landroid/content/Intent;->createChooser(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;

    move-result-object v5

    invoke-virtual {v0, v5}, Lio/github/shumtugle/jot/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    :catch_0
    move-exception v3

    return-void
.end method
