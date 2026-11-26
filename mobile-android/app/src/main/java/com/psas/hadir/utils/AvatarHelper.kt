package com.psas.hadir.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.Outline
import android.net.Uri
import android.os.Build
import android.util.LruCache
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.ImageView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.max

object AvatarHelper {

    private val memoryCache = object : LruCache<String, Bitmap>(8 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap): Int = value.byteCount
    }

    fun applyCircularClip(imageView: ImageView) {
        imageView.outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setOval(0, 0, view.width, view.height)
            }
        }
        imageView.clipToOutline = true
    }

    fun invalidate(url: String?) {
        if (!url.isNullOrBlank()) {
            memoryCache.remove(url)
        }
    }

    fun loadAvatar(
        scope: CoroutineScope,
        imageView: ImageView,
        initialsView: View?,
        url: String?
    ) {
        applyCircularClip(imageView)

        if (url.isNullOrBlank()) {
            imageView.visibility = View.GONE
            imageView.setImageDrawable(null)
            initialsView?.visibility = View.VISIBLE
            return
        }

        val cached = memoryCache.get(url)
        if (cached != null && !cached.isRecycled) {
            imageView.setImageBitmap(cached)
            imageView.visibility = View.VISIBLE
            initialsView?.visibility = View.GONE
            return
        }

        imageView.tag = url
        scope.launch {
            val bitmap = withContext(Dispatchers.IO) { fetchBitmap(url) }
            if (imageView.tag != url) return@launch
            if (bitmap != null) {
                memoryCache.put(url, bitmap)
                imageView.setImageBitmap(bitmap)
                imageView.visibility = View.VISIBLE
                initialsView?.visibility = View.GONE
            } else {
                imageView.visibility = View.GONE
                initialsView?.visibility = View.VISIBLE
            }
        }
    }

    private fun fetchBitmap(urlString: String): Bitmap? {
        return try {
            val conn = (URL(urlString).openConnection() as HttpURLConnection).apply {
                connectTimeout = 5000
                readTimeout = 8000
                doInput = true
                connect()
            }
            if (conn.responseCode !in 200..299) {
                conn.disconnect()
                return null
            }
            val bytes = conn.inputStream.use { it.readBytes() }
            conn.disconnect()

            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
            val sampleSize = calculateInSampleSize(bounds.outWidth, bounds.outHeight, 512, 512)

            val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sampleSize }
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size, decodeOpts)
        } catch (_: Exception) {
            null
        }
    }

    fun createCompressedMultipart(context: Context, uri: Uri): MultipartBody.Part? {
        return try {
            val bitmap = decodeScaledBitmap(context, uri, 800, 800) ?: return null
            val out = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
            val jpegBytes = out.toByteArray()
            val mediaType = MediaType.parse("image/jpeg")
            val body = RequestBody.create(mediaType, jpegBytes)
            MultipartBody.Part.createFormData("photo", "avatar_${System.currentTimeMillis()}.jpg", body)
        } catch (_: Exception) {
            null
        }
    }

    private fun decodeScaledBitmap(context: Context, uri: Uri, reqW: Int, reqH: Int): Bitmap? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val source = ImageDecoder.createSource(context.contentResolver, uri)
            return ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                val sample = calculateInSampleSize(info.size.width, info.size.height, reqW, reqH)
                if (sample > 1) {
                    decoder.setTargetSampleSize(sample)
                }
                decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            }
        }

        val boundsOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, boundsOpts)
        }
        val sample = calculateInSampleSize(boundsOpts.outWidth, boundsOpts.outHeight, reqW, reqH)
        val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sample }
        return context.contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, decodeOpts)
        }
    }

    private fun calculateInSampleSize(width: Int, height: Int, reqW: Int, reqH: Int): Int {
        var inSampleSize = 1
        if (height > reqH || width > reqW) {
            val halfHeight = height / 2
            val halfWidth = width / 2
            while ((halfHeight / inSampleSize) >= reqH && (halfWidth / inSampleSize) >= reqW) {
                inSampleSize *= 2
            }
        }
        return max(1, inSampleSize)
    }
}
