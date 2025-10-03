import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppointmentsBarChartProps {
  rows: any[] | null;
}

const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AppointmentsBarChart({ rows }: AppointmentsBarChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Processar dados reais dos agendamentos
  const chartData = useMemo(() => {
    if (!rows || rows.length === 0) {
      // Retornar dados vazios se não houver rows
      if (selectedPeriod === "week") {
        return weekDaysShort.map(day => ({ day, count: 0 }));
      } else if (selectedPeriod === "month") {
        return getMonthLabels().map(month => ({ day: month, count: 0 }));
      } else {
        return getYearLabels().map(year => ({ day: year, count: 0 }));
      }
    }

    if (selectedPeriod === "week") {
      // Lógica para semana (mantida como estava)
      const hoje = new Date();
      const hojeBrasil = new Date(hoje.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      const inicioSemana = new Date(hojeBrasil);
      inicioSemana.setDate(hojeBrasil.getDate() - hojeBrasil.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      const counts = new Array(7).fill(0);

      rows.forEach(row => {
        if (!row.data_agendamento) return;

        try {
          const dataAgendamento = new Date(row.data_agendamento);
          const dataAgendamentoBrasil = new Date(dataAgendamento.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
          
          if (dataAgendamentoBrasil >= inicioSemana && dataAgendamentoBrasil <= fimSemana) {
            const dayOfWeek = dataAgendamentoBrasil.getDay();
            counts[dayOfWeek]++;
          }
        } catch (error) {
          console.error('Erro ao processar data:', error);
        }
      });

      return weekDaysShort.map((day, index) => ({
        day,
        count: counts[index]
      }));
    } else if (selectedPeriod === "month") {
      // Lógica para mês
      const monthLabels = getMonthLabels();
      const counts = new Array(12).fill(0);

      rows.forEach(row => {
        if (!row.data_agendamento) return;

        try {
          const dataAgendamento = new Date(row.data_agendamento);
          const dataAgendamentoBrasil = new Date(dataAgendamento.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
          
          const month = dataAgendamentoBrasil.getMonth(); // 0 = Jan, 1 = Fev, etc.
          counts[month]++;
        } catch (error) {
          console.error('Erro ao processar data:', error);
        }
      });

      return monthLabels.map((month, index) => ({
        day: month,
        count: counts[index]
      }));
    } else {
      // Lógica para ano (últimos 4 anos)
      const yearLabels = getYearLabels();
      const counts = new Array(4).fill(0);
      const currentYear = new Date().getFullYear();

      rows.forEach(row => {
        if (!row.data_agendamento) return;

        try {
          const dataAgendamento = new Date(row.data_agendamento);
          const dataAgendamentoBrasil = new Date(dataAgendamento.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
          
          const year = dataAgendamentoBrasil.getFullYear();
          
          // Verificar se o ano está nos últimos 4 anos
          // Mapear: 2021->0, 2022->1, 2023->2, 2024->3
          const yearIndex = year - (currentYear - 3);
          if (yearIndex >= 0 && yearIndex < 4) {
            counts[yearIndex]++;
          }
        } catch (error) {
          console.error('Erro ao processar data:', error);
        }
      });

      return yearLabels.map((year, index) => ({
        day: year,
        count: counts[index]
      }));
    }
  }, [rows, selectedPeriod]);

  // Função para obter labels dos meses
  function getMonthLabels() {
    return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  }

  // Função para obter labels dos anos (últimos 4 anos)
  function getYearLabels() {
    const currentYear = new Date().getFullYear();
    return [
      (currentYear - 3).toString(),
      (currentYear - 2).toString(),
      (currentYear - 1).toString(),
      currentYear.toString()
    ];
  }

  // Calcular total do período
  const totalPeriod = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.count, 0);
  }, [chartData]);

  // Encontrar o valor máximo para normalizar as barras
  const maxCount = Math.max(...chartData.map(d => d.count), 1); // Mínimo 1 para evitar divisão por zero
  
  // Calcular altura das barras em pixels
  const calculateBarHeight = (count: number) => {
    if (count === 0) return 0;
    
    // Para números pequenos (1-15), usar escala linear com incremento bem visível
    if (count <= 15) {
      // Cada consulta adiciona 12px de altura - muito visível!
      const height = count * 12;
      console.log(`📊 Barra: ${count} consultas → ${height}px de altura`);
      return height;
    } else {
      // Para números maiores, usar escala proporcional
      const baseHeight = 15 * 12; // 180px para 15 consultas
      const remainingCount = count - 15;
      const remainingHeight = (remainingCount / Math.max(maxCount - 15, 1)) * 60; // 60px restante
      const finalHeight = Math.min(baseHeight + remainingHeight, 240);
      console.log(`📊 Barra: ${count} consultas → ${finalHeight}px de altura (escala proporcional)`);
      return finalHeight;
    }
  };

  return (
    <Card className="p-6 bg-white rounded-xl shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50">
            <BarChart3 className="w-5 h-5 text-[#E21929]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Agendamentos</h2>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === "week" ? "Por dia da semana" : 
               selectedPeriod === "month" ? "Por mês" : "Por ano"}
            </p>
          </div>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="year">Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vertical Bar Chart */}
      <div className="relative h-64 mb-4 bg-gray-50 rounded-lg p-2">
        <div className="flex items-end justify-between h-full gap-2 px-2">
          {chartData.map((item, index) => {
            const heightPercentage = calculateBarHeight(item.count);
            const isHovered = hoveredBar === index;
            
            // Debug: Log detalhado para cada barra
            console.log(`🔍 Barra ${index} (${item.day}): ${item.count} agendamentos → ${heightPercentage}% altura`);
            
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-end gap-3 relative group"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap">
                    <div className="font-semibold">{item.count} agendamentos</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                )}
                
                {/* Bar */}
                <div
                  className={`w-full rounded-t-xl transition-all duration-300 ${
                    isHovered 
                      ? 'bg-[#E21929] shadow-lg' 
                      : 'bg-[#E21929]/70'
                  }`}
                  style={{ 
                    height: `${heightPercentage}px`, // Mudando de % para px
                    minHeight: item.count > 0 ? '8px' : '0px',
                    // Debug: borda temporária para visualizar
                    border: '2px solid white',
                    maxHeight: '200px' // Limite máximo
                  }}
                  title={`${item.count} agendamentos (${heightPercentage}px altura)`}
                >
                  {/* Gradient overlay */}
                  <div className="w-full h-full rounded-t-xl bg-gradient-to-t from-transparent to-white/10"></div>
                </div>
                
                {/* Day Label */}
                <span className="text-xs font-medium text-muted-foreground">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {selectedPeriod === "week" ? "Total da semana" : 
             selectedPeriod === "month" ? "Total do ano" : "Total dos últimos 4 anos"}
          </span>
          <span className="font-bold text-foreground">
            {totalPeriod} {totalPeriod === 1 ? 'agendamento' : 'agendamentos'}
          </span>
        </div>
      </div>
    </Card>
  );
}

