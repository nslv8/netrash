import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import GenTable from "../layout/gen-table";
import { Eye } from "lucide-react";

const TransaksiDetailModal = ({
  isOpen,
  onClose,
  data,
  tanggal,
  onDataChange,
  setTransaksiList,
}) => {
  const [selectedNasabah, setSelectedNasabah] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [nasabahDetailData, setNasabahDetailData] = useState([]);

  // Kelompokkan data berdasarkan nama nasabah
  const groupedData = data.reduce((acc, curr) => {
    const nama = curr["nasabah.nama"];
    if (!acc[nama]) {
      acc[nama] = {
        "nasabah.nama": nama,
        beratsampah: 0,
        totalhargasampah: 0,
        detail: [],
      };
    }
    acc[nama].beratsampah += Number(curr.beratsampah);
    acc[nama].totalhargasampah += Number(curr.totalhargasampah);
    acc[nama].detail.push(curr);
    return acc;
  }, {});

  const processedData = Object.values(groupedData);

  const handleShowDetail = (nama) => {
    const item = groupedData[nama];
    if (item) {
      setSelectedNasabah(nama);
      setNasabahDetailData(item.detail);
      setShowDetail(true);
    }
  };

  const columns = [
    {
      header: "No",
      cell: ({ row }) => <span>{row.index + 1}</span>,
    },
    {
      accessorKey: "nasabah.nama",
      header: "Nama Nasabah",
    },
    {
      accessorKey: "beratsampah",
      header: "Berat Sampah",
      cell: ({ row }) => <span>{row.original.beratsampah.toFixed(2)} Kg</span>,
    },
    {
      accessorKey: "totalhargasampah",
      header: "Total Harga Sampah",
      cell: ({ row }) => (
        <span>
          Rp{row.original.totalhargasampah.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => handleShowDetail(row.original["nasabah.nama"])}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detail Transaksi - {tanggal}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <GenTable data={processedData} columns={columns} />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showDetail && (
        <TransaksiNasabahDetailModal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          data={nasabahDetailData}
          nasabahNama={selectedNasabah}
          tanggal={tanggal}
          onDataChange={onDataChange}
          setTransaksiList={setTransaksiList}
        />
      )}
    </>
  );
};

export default TransaksiDetailModal;
