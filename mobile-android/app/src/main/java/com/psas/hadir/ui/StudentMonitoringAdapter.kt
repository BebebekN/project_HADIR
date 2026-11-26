package com.psas.hadir.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.psas.hadir.R
import com.psas.hadir.data.model.StudentMonitoringItem
import java.util.Locale

class StudentMonitoringAdapter(
    private var items: List<StudentMonitoringItem> = emptyList()
) : RecyclerView.Adapter<StudentMonitoringAdapter.StudentViewHolder>() {

    fun submitList(newItems: List<StudentMonitoringItem>) {
        items = newItems
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StudentViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_student_monitoring, parent, false)
        return StudentViewHolder(view)
    }

    override fun onBindViewHolder(holder: StudentViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    class StudentViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvName: TextView = itemView.findViewById(R.id.tvStudentName)
        private val tvNisStatus: TextView = itemView.findViewById(R.id.tvStudentNisStatus)
        private val tvStars: TextView = itemView.findViewById(R.id.tvStudentStars)
        private val tvPoints: TextView = itemView.findViewById(R.id.tvStudentPoints)

        fun bind(item: StudentMonitoringItem) {
            val ctx = itemView.context
            tvName.text = item.namaLengkap
            val jamInfo = item.jamDatang?.let { " ($it)" } ?: ""
            tvNisStatus.text = "NIS: ${item.nis} • ${item.statusHariIni}$jamInfo"
            tvStars.text = String.format(Locale.US, "%.1f ★", item.bintang)
            tvPoints.text = "${item.poinKedisiplinan} Poin"

            val pointColor = when {
                item.poinKedisiplinan >= 95 -> R.color.emerald_600
                item.poinKedisiplinan >= 85 -> R.color.blue_500
                item.poinKedisiplinan >= 75 -> R.color.amber_500
                else -> R.color.rose_600
            }
            tvPoints.setTextColor(ContextCompat.getColor(ctx, pointColor))
        }
    }
}
