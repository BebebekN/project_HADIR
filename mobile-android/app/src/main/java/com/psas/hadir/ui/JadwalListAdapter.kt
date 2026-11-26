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

class JadwalListAdapter(
    private var items: List<JadwalItem> = emptyList(),
    private var selectedHari: String = "Senin"
) : RecyclerView.Adapter<JadwalListAdapter.JadwalViewHolder>() {

    fun submitList(newItems: List<JadwalItem>, hari: String) {
        items = newItems
        selectedHari = hari
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): JadwalViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_jadwal_list, parent, false)
        return JadwalViewHolder(view)
    }

    override fun onBindViewHolder(holder: JadwalViewHolder, position: Int) {
        holder.bind(items[position], selectedHari, position == 0, position == items.lastIndex)
    }

    override fun getItemCount(): Int = items.size

    class JadwalViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val vLineTop: View = itemView.findViewById(R.id.vLineTop)
        private val vLineBottom: View = itemView.findViewById(R.id.vLineBottom)
        private val card: MaterialCardView = itemView.findViewById(R.id.cardJadwalItem)
        private val tvDurasi: TextView = itemView.findViewById(R.id.tvItemDurasi)
        private val ivDurasiIcon: ImageView = itemView.findViewById(R.id.ivDurasiIcon)
        private val tvKegiatan: TextView = itemView.findViewById(R.id.tvItemKegiatan)
        private val tvGuru: TextView = itemView.findViewById(R.id.tvItemGuru)
        private val ivCheck: ImageView = itemView.findViewById(R.id.ivItemCheck)
        private val tvStatus: TextView = itemView.findViewById(R.id.tvItemStatus)

        fun bind(item: JadwalItem, hari: String, isFirst: Boolean, isLast: Boolean) {
            val ctx = itemView.context
            vLineTop.visibility = if (isFirst) View.INVISIBLE else View.VISIBLE
            vLineBottom.visibility = if (isLast) View.INVISIBLE else View.VISIBLE

            tvDurasi.text = (item.durasi ?: "${item.jamMulai} - ${item.jamSelesai}") + " WIB"
            tvKegiatan.text = item.namaKegiatan
            val isBreak = item.namaKegiatan.contains("istirahat", ignoreCase = true)
            tvGuru.text = if (item.namaGuru.isNotBlank() && item.namaGuru != "-") {
                item.namaGuru
            } else {
                "Jam Istirahat / Kegiatan Sekolah"
            }

            // Real-time evaluation: green checkmark ONLY when Mon-Fri day & jam_selesai passed
            val status = ScheduleTimeUtils.evaluateSessionStatus(
                hari = item.hari ?: hari,
                jamMulai = item.jamMulai,
                jamSelesai = item.jamSelesai
            )

            card.setCardBackgroundColor(
                ContextCompat.getColor(ctx, if (isBreak) R.color.canvas_bg else R.color.white)
            )

            when (status) {
                SessionStatus.COMPLETED -> {
                    ivCheck.setImageResource(R.drawable.ic_check_circle_solid_green)
                    ivCheck.clearColorFilter()
                    tvStatus.text = "Selesai"
                    tvStatus.setBackgroundResource(R.drawable.bg_pill_green)
                    tvStatus.setTextColor(ContextCompat.getColor(ctx, R.color.badge_green_text))
                    ivDurasiIcon.setImageResource(R.drawable.ic_check_circle_solid_green)
                    ivDurasiIcon.clearColorFilter()
                    tvDurasi.setTextColor(ContextCompat.getColor(ctx, R.color.badge_green_text))
                    card.strokeColor = ContextCompat.getColor(ctx, R.color.badge_green_bg)
                }
                SessionStatus.ONGOING -> {
                    ivCheck.setImageResource(R.drawable.bg_ring_blue_active)
                    ivCheck.clearColorFilter()
                    tvStatus.text = "Berlangsung"
                    tvStatus.setBackgroundResource(R.drawable.bg_pill_blue)
                    tvStatus.setTextColor(ContextCompat.getColor(ctx, R.color.white))
                    ivDurasiIcon.setImageResource(R.drawable.ic_clock_gray)
                    ivDurasiIcon.setColorFilter(ContextCompat.getColor(ctx, R.color.brand_blue))
                    tvDurasi.setTextColor(ContextCompat.getColor(ctx, R.color.brand_blue))
                    card.strokeColor = ContextCompat.getColor(ctx, R.color.brand_blue)
                }
                SessionStatus.WEEKEND -> {
                    ivCheck.setImageResource(R.drawable.bg_ring_gray)
                    ivCheck.clearColorFilter()
                    tvStatus.text = "Libur"
                    tvStatus.setBackgroundResource(R.drawable.bg_pill_orange)
                    tvStatus.setTextColor(ContextCompat.getColor(ctx, R.color.badge_orange_text))
                    ivDurasiIcon.setImageResource(R.drawable.ic_clock_orange)
                    ivDurasiIcon.clearColorFilter()
                    tvDurasi.setTextColor(ContextCompat.getColor(ctx, R.color.badge_orange_text))
                    card.strokeColor = ContextCompat.getColor(ctx, R.color.border_light)
                }
                SessionStatus.UPCOMING -> {
                    ivCheck.setImageResource(R.drawable.bg_ring_gray)
                    ivCheck.clearColorFilter()
                    tvStatus.text = "Belum"
                    tvStatus.setBackgroundResource(R.drawable.bg_pill_outline)
                    tvStatus.setTextColor(ContextCompat.getColor(ctx, R.color.text_muted))
                    ivDurasiIcon.setImageResource(R.drawable.ic_clock_gray)
                    ivDurasiIcon.setColorFilter(ContextCompat.getColor(ctx, R.color.text_muted))
                    tvDurasi.setTextColor(ContextCompat.getColor(ctx, R.color.text_muted))
                    card.strokeColor = ContextCompat.getColor(ctx, R.color.border_light)
                }
            }
        }
    }
}
