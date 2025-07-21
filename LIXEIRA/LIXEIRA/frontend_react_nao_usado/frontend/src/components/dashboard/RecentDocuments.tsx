import React from 'react';



interface RecentDocumentsProps {

  documents: any[];

}



const RecentDocuments: React.FC<RecentDocumentsProps> = ({ documents }) => (

  <div>

    {/* Render recent documents here */}

    {documents.map((doc, idx) => (

      <div key={idx}>{doc.name || 'Documento sem nome'}</div>

    ))}

  </div>

);



export default RecentDocuments;


