// client/src/components/Pagination.jsx

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    onPageChange,
    onItemsPerPageChange 
}) => {
    // Calculer les items affichés
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Générer les numéros de pages à afficher
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // Nombre max de pages visibles

        if (totalPages <= maxVisible) {
            // Afficher toutes les pages si <= 5
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logique pour afficher 5 pages avec ... si nécessaire
            if (currentPage <= 3) {
                // Début : 1 2 3 4 5 ... N
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Fin : 1 ... N-4 N-3 N-2 N-1 N
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                // Milieu : 1 ... X-1 X X+1 ... N
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    // Toujours afficher au moins le sélecteur d'items par page
    const showFullPagination = totalPages > 1;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
            {/* Indicateur de résultats */}
            <div className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{startItem}</span> à{' '}
                <span className="font-medium">{endItem}</span> sur{' '}
                <span className="font-medium">{totalItems}</span> contrat(s)
            </div>

            {/* Contrôles de pagination */}
            {showFullPagination && (
                <div className="flex items-center gap-2">
                {/* Bouton Première page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Première page"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Bouton Page précédente */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Page précédente"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Numéros de pages */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (page === '...') {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                                    ...
                                </span>
                            );
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`px-3 py-1 rounded-md font-medium transition ${
                                    currentPage === page
                                        ? 'bg-indigo-600 text-white'
                                        : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Bouton Page suivante */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Page suivante"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Bouton Dernière page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Dernière page"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
            )}

            {/* Sélecteur d'items par page */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-700">Afficher :</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
        </div>
    );
};

export default Pagination;