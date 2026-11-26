package com.psas.hadir.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.card.MaterialCardView
import com.psas.hadir.R
import com.psas.hadir.data.model.JadwalItem
import com.psas.hadir.utils.ScheduleTimeUtils
import com.psas.hadir.utils.SessionStatus

class JadwalCarouselAdapter(
    private var items: List<JadwalItem> = emptyList(),
    private var hariIni: String = ScheduleTimeUtils.getCurrentDayName()
) : RecyclerView.Adapter<JadwalCarouselAdapter.CarouselViewHolder>() {

    fun submitList(newItems: List<JadwalItem>, hari: String) {
        items = newItems
        hariIni = hari
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CarouselViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_jadwal_carousel, parent, false)
        return CarouselViewHolder(view)
    }

    override fun onBindViewHolder(holder: CarouselViewHolder, position: Int) {
        holder.bind(items[position], hariIni)
    }

    override fun getItemCount(): Int = items.size

    class CarouselViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val card: MaterialCardView = itemView.findViewById(R.id.cardCarouselItem)
        private val tvDurasi: TextView = itemView.findViewById(R.id.tvDurasi)
        private val tvNamaKegiatan: TextView = itemView.findViewById(R.id.tvNamaKegiatan)
        private val tvNamaGuru: TextView = itemView.findViewById(R.id.tvNamaGuru)
        private val ivStatusCheck: ImageView = itemView.findViewById(R.id.ivStatusCheck)
        private val tvStatusLabel: TextView = itemView.findViewById(R.id.tvStatusLabel)

        fun bind(item: JadwalItem, hari: String) {
            val ctx = itemView.context
            tvDurasi.text = (item.durasi ?: "${item.jamMulai} - ${item.jamSelesai}") + " WIB"
            tvNamaKegiatan.text = item.namaKegiatan
            tvNamaGuru.text = if (item.namaGuru.isNotBlank() && item.namaGuru != "-") {
                item.namaGuru
            } else {
                "Jam Istirahat / Kegiatan"
            }

            // Real-time status evaluation on Monday-Friday (completed only when end time passed)
            val status = ScheduleTimeUtils.evaluateSessionStatus(
                hari = item.hari ?: hari,
                jamMulai = item.jamMulai,
                jamSelesai = item.jamSelesai
            )

            when (status) {
                SessionStatus.COMPLETED -> {
                    ivStatusCheck.setImageResource(R.drawable.ic_check_circle_solid_green)
                    ivStatusCheck.clearColorFilter()
                    tvStatusLabel.text = "Selesai"
                    tvStatusLabel.setBackgroundResource(R.drawable.bg_pill_green)
                    tvStatusLabel.setTextColor(ContextCompat.getColor(ctx, R.color.badge_green_text))
                    tvDurasi.setTextColor(ContextCompat.getColor(ctx, R.color.badge_green_text))
                    card.setCardBackgroundColor(ContextCompat.getColor(ctx, R.color.white))
                    card.strokeColor = ContextCompat.getColor(ctx, R.color.badge_green_bg)
                }
                SessionStatus.ONGOING -> {
                    ivStatusCheck.setImageResource(R.drawable.ic_clock_gray)
                    ivStatusCheck.setColorFilter(ContextCompat.getColor(ctx, R.color.brand_blue))
                    tvStatusLabel.text = "Berlangsung"
                    tvStatusLabel.setBackgroundResource(R.drawable.bg_pill_blue)
                    tvStatusLabel.setTextColor(ContextCompat.getColor(ctx, R.color.white))
                    tvDurasi.setTextColor(ContextCompat.getColor(ctx, R.color.brand_blue))
                    card.setCardBackgroundColor(ContextCompat.getColor(ctx, R.color.white))
                    card.strokeColor = ContextCompat.getColor(ctx, R.color.brand_blue)
                }
                else -> {
                    ivStatusCheck.setImageResource(R.drawable.ic_clock_orange)
                    ivStatusCheck.clearColorFilter()
                    tvStatusLabel.text = "Berikutnya"
                    tvStatusLabel.setBackgroundResource(R.drawable.bg_pill_orange)
                    tvStatusLabel.setTextColor(ContextCompat.getColor(ctx, R.color.badge_orange_text))
                    tvDurasi.setTextColor(ContextCompat.getColor(ctx, R.color.text_muted))
                    card.setCardBackgroundColor(ContextCompat.getColor(ctx, R.color.white))
                    card.strokeColor = ContextCompat.getColor(ctx, R.color.border_light)
                }
            }
        }
    }
}
